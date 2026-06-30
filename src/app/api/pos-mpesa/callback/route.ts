import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// We use the Service Role key here because Webhooks do not have user cookies/sessions.
// This allows the route to bypass RLS and securely update the table.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ==========================================
// STRICT TYPES
// Eliminates the ESLint "any" errors
// ==========================================
interface STKUpdatePayload {
  status: 'success' | 'failed';
  error_message: string | null;
  updated_at: string;
  receipt_number?: string;
}

interface DarajaCallbackItem {
  Name: string;
  Value: string | number;
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const stkCallback = data?.Body?.stkCallback;

    if (!stkCallback) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // FIX 1: Removed the unused 'MerchantRequestID'
    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

    // FIX 2: Used 'const' instead of 'let', and strictly typed the object
    const updatePayload: STKUpdatePayload = {
      status: ResultCode === 0 ? 'success' : 'failed',
      error_message: ResultCode !== 0 ? ResultDesc : null,
      updated_at: new Date().toISOString()
    };

    // If successful, extract the exact Safaricom Receipt Number (e.g., QKT...)
    if (ResultCode === 0 && CallbackMetadata?.Item) {
      // FIX 3: Replaced 'any' with the strictly defined DarajaCallbackItem interface
      const receiptItem = CallbackMetadata.Item.find((item: DarajaCallbackItem) => item.Name === 'MpesaReceiptNumber');
      
      if (receiptItem) {
        updatePayload.receipt_number = String(receiptItem.Value); // Ensure it casts safely to string
      }
    }

    // Update the database. This UPDATE fires the Realtime WebSocket event to the POS!
    const { error } = await supabase
      .from('pos_stk_requests')
      .update(updatePayload)
      .eq('checkout_request_id', CheckoutRequestID);

    if (error) {
      console.error('[Webhook DB Update Error]:', error);
    }

    // Safaricom strictly requires a success response to acknowledge receipt
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" });

  } catch (error) {
    console.error('[Webhook Exception]:', error);
    // Even if our processing fails, tell Safaricom we received it so they don't retry unnecessarily
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Processed with errors" });
  }
}