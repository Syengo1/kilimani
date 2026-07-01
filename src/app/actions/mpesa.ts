'use server';

import { createClient } from '@/lib/supabase/server';
const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY!;
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET!;
const MPESA_PASSKEY = process.env.MPESA_PASSKEY!;
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE!;
// Your production URL (e.g., https://kilimanihair.com)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!; 
const DARAJA_ENV = process.env.MPESA_ENV === 'live' ? 'api' : 'sandbox';

// Helper to format phone to Safaricom standard: 2547XXXXXXXX
function formatSafaricomNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) return `254${cleaned.substring(1)}`;
  if (cleaned.startsWith('254')) return cleaned;
  if (cleaned.length === 9) return `254${cleaned}`;
  return cleaned; // Fallback
}

export async function initiatePosSTKPush(phone: string, amount: number) {
  try {
    const supabase = await createClient();
    const formattedPhone = formatSafaricomNumber(phone);

    // 1. Generate Daraja OAuth Token
    const authBuffer = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');
    const authResponse = await fetch(`https://${DARAJA_ENV}.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${authBuffer}` },
      cache: 'no-store'
    });
    
    if (!authResponse.ok) throw new Error('Failed to authenticate with Daraja');
    const { access_token } = await authResponse.json();

    // 2. Generate Security Credentials
    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
    const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString('base64');

    // 3. Send STK Push Request
    const stkResponse = await fetch(`https://${DARAJA_ENV}.safaricom.co.ke/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        BusinessShortCode: MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline', // or CustomerBuyGoodsOnline
        Amount: Math.ceil(amount),
        PartyA: formattedPhone,
        PartyB: MPESA_SHORTCODE,
        PhoneNumber: formattedPhone,
        CallBackURL: `${APP_URL}/api/pos-mpesa/callback`,
        AccountReference: 'Kilimani POS',
        TransactionDesc: 'POS Terminal Checkout'
      })
    });

    const stkData = await stkResponse.json();

    if (stkData.ResponseCode !== '0') {
      throw new Error(stkData.errorMessage || stkData.CustomerMessage || 'STK Push Failed');
    }

    // 4. Log the pending request in the database so the webhook can update it
    const { error: dbError } = await supabase.from('pos_stk_requests').insert({
      checkout_request_id: stkData.CheckoutRequestID,
      merchant_request_id: stkData.MerchantRequestID,
      phone_number: formattedPhone,
      amount: amount,
      status: 'pending'
    });

    if (dbError) console.error('[STK DB Insert Error]:', dbError);

    // 5. Return the ID so the POS UI knows what to listen for via Realtime
    return { success: true, checkoutRequestId: stkData.CheckoutRequestID };

  } catch (error) {
    // FIX: Safely check if the caught error is an actual Error object to satisfy ESLint
    console.error('[STK Push Exception]:', error);
    const errorMessage = error instanceof Error ? error.message : 'Server error initiating M-Pesa';
    return { success: false, error: errorMessage };
  }
}