// Ensure these are safely inside your .env.local file
const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY!;
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET!;
const MPESA_PASSKEY = process.env.MPESA_PASSKEY!;
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE!; 
const MPESA_CALLBACK_URL = process.env.MPESA_CALLBACK_URL!; // e.g., https://yourdomain.com/api/mpesa/callback

// M-Pesa Sandbox/Production Environment URL
const DARAJA_BASE_URL = 'https://sandbox.safaricom.co.ke'; // Change to https://api.safaricom.co.ke for production

async function getMpesaToken(): Promise<string> {
  const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');
  
  const response = await fetch(`${DARAJA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
    cache: 'no-store',
  });

  if (!response.ok) throw new Error('Failed to generate M-Pesa Token');
  const data = await response.json();
  return data.access_token;
}

export async function initiateSTKPush(phone: string, amount: number, orderRef: string) {
  const token = await getMpesaToken();
  
  // Format the timestamp exactly as Daraja demands (YYYYMMDDHHmmss)
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  
  // Generate the encrypted password
  const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString('base64');

  // Format phone number to strictly 2547XXXXXXXX
  const formattedPhone = phone.startsWith('0') ? `254${phone.slice(1)}` : phone;

  const payload = {
    BusinessShortCode: MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline", // Or 'CustomerBuyGoodsOnline' if using Till Number
    Amount: Math.ceil(amount), // Safaricom rejects decimals
    PartyA: formattedPhone,
    PartyB: MPESA_SHORTCODE,
    PhoneNumber: formattedPhone,
    CallBackURL: MPESA_CALLBACK_URL,
    AccountReference: orderRef, // This is what the user sees on their phone (KIL-X9B2P7)
    TransactionDesc: "Payment for Kilimani Hair"
  };

  const response = await fetch(`${DARAJA_BASE_URL}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  
  if (data.ResponseCode !== "0") {
    throw new Error(data.errorMessage || 'Failed to initiate STK Push');
  }

  // RETURN THIS: We MUST save CheckoutRequestID to our DB
  return {
    checkoutRequestId: data.CheckoutRequestID,
    customerMessage: data.CustomerMessage // "Success. Request accepted for processing"
  };
}