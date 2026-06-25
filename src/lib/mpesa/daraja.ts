// ============================================================================
// STRICT DARAJA INTERFACES
// ============================================================================
interface DarajaTokenResponse {
  access_token: string;
  expires_in: string;
}

interface DarajaSTKResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
  errorMessage?: string;
  errorCode?: string;
}

// ============================================================================
// ENVIRONMENT & CONFIGURATION ENGINE
// ============================================================================
const getDarajaConfig = () => {
  // Gracefully validate critical environment variables
  const requiredEnvs = ['MPESA_CONSUMER_KEY', 'MPESA_CONSUMER_SECRET', 'MPESA_PASSKEY', 'MPESA_SHORTCODE', 'MPESA_CALLBACK_URL'];
  for (const env of requiredEnvs) {
    if (!process.env[env]) {
      throw new Error(`CRITICAL: Missing M-Pesa Environment Variable: ${env}`);
    }
  }

  // Auto-toggles between production and sandbox based on your environment
  const isProd = process.env.MPESA_ENVIRONMENT === 'production';
  const baseUrl = isProd ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';

  // Safaricom drops webhooks if the URL contains a trailing slash. We sanitize it here.
  let callbackUrl = process.env.MPESA_CALLBACK_URL!;
  if (callbackUrl.endsWith('/')) {
    callbackUrl = callbackUrl.slice(0, -1);
  }

  return {
    consumerKey: process.env.MPESA_CONSUMER_KEY!,
    consumerSecret: process.env.MPESA_CONSUMER_SECRET!,
    passkey: process.env.MPESA_PASSKEY!,
    shortcode: process.env.MPESA_SHORTCODE!,
    callbackUrl,
    baseUrl
  };
};

// ============================================================================
// UTILITY ENGINES
// ============================================================================

/**
 * Generates a strictly formatted YYYYMMDDHHmmss timestamp locked to East African Time.
 * Prevents Daraja password rejection if your hosting server defaults to UTC.
 */
const generateKenyanTimestamp = (): string => {
  const date = new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' }));
  const pad = (n: number) => n.toString().padStart(2, '0');
  
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
};

/**
 * Mathematically sanitizes phone numbers into Safaricom's strict 2547XXXXXXXX format.
 */
const sanitizePhone = (phone: string): string => {
  let clean = phone.replace(/\D/g, ''); // Strip spaces, hyphens, and plus signs
  if (clean.startsWith('0')) clean = `254${clean.substring(1)}`;
  if (clean.startsWith('254') && clean.length === 12) return clean;
  throw new Error(`Invalid Kenyan phone number format provided to Daraja: ${phone}`);
};

// ============================================================================
// CORE API ROUTING
// ============================================================================

/**
 * Retrieves a stateless, short-lived OAuth token from Safaricom.
 */
async function getMpesaToken(config: ReturnType<typeof getDarajaConfig>): Promise<string> {
  const auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64');
  
  try {
    const response = await fetch(`${config.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${auth}` },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Auth Rejection: ${errorText}`);
    }

    const data = (await response.json()) as DarajaTokenResponse;
    return data.access_token;
  } catch (error) {
    console.error('[Daraja Authorization Failure]', error);
    throw new Error('Failed to negotiate secure token with Safaricom.');
  }
}

/**
 * Triggers the secure STK Push Prompt on the Customer's device.
 */
export async function initiateSTKPush(phone: string, amount: number, orderRef: string) {
  const config = getDarajaConfig();
  const token = await getMpesaToken(config);
  
  const timestamp = generateKenyanTimestamp();
  const password = Buffer.from(`${config.shortcode}${config.passkey}${timestamp}`).toString('base64');
  const formattedPhone = sanitizePhone(phone);

  const payload = {
    BusinessShortCode: config.shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline", // Change to 'CustomerBuyGoodsOnline' if you upgrade to a Till Number
    Amount: Math.ceil(amount), // Safaricom's API will violently reject decimal points
    PartyA: formattedPhone,
    PartyB: config.shortcode,
    PhoneNumber: formattedPhone,
    CallBackURL: config.callbackUrl,
    AccountReference: orderRef.substring(0, 12), // Daraja crashes if AccountReference exceeds 12 characters
    TransactionDesc: "Kilimani Hair Checkout"
  };

  try {
    const response = await fetch(`${config.baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as DarajaSTKResponse;
    
    // Safaricom returns "0" (String) for successful initiation. 
    // Anything else indicates an API rejection (e.g., Daily Limit Exceeded, Invalid Number)
    if (!response.ok || data.ResponseCode !== "0") {
      console.error('[Daraja STK Push Rejection Payload]', data);
      throw new Error(data.errorMessage || data.ResponseDescription || 'Safaricom rejected the transaction request.');
    }

    // Return the exact identifiers required by the checkout action to map the webhook later
    return {
      checkoutRequestId: data.CheckoutRequestID,
      customerMessage: data.CustomerMessage 
    };

  } catch (error) {
    console.error('[Daraja Network Exception]', error);
    throw error;
  }
}