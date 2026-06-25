import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 1. STRICT TYPING: Define the exact shape of Safaricom's Callback Items
interface MpesaCallbackItem {
  Name: string;
  Value?: string | number;
}

/**
 * ENTERPRISE M-PESA WEBHOOK RECEIVER
 * Processes asynchronous payment results from Safaricom Daraja.
 */
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const stkCallback = data?.Body?.stkCallback;

    // 1. SECURITY PRE-FLIGHT: Reject malformed payloads instantly
    if (!stkCallback || !stkCallback.CheckoutRequestID) {
      console.error('[M-Pesa Webhook] Invalid Payload structure detected.', data);
      return NextResponse.json({ error: 'Invalid Payload' }, { status: 400 });
    }

    const checkoutRequestId = stkCallback.CheckoutRequestID as string;
    const resultCode = stkCallback.ResultCode as number;

    // 2. PRIVILEGED DATABASE ACCESS 
    // Webhooks operate outside user sessions; Service Role Key is required to bypass RLS.
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (resultCode === 0 && stkCallback.CallbackMetadata?.Item) {
      // ====================================================================
      // SCENARIO A: SUCCESSFUL PAYMENT
      // ====================================================================
      const callbackItems: MpesaCallbackItem[] = stkCallback.CallbackMetadata.Item;
      
      const mpesaReceipt = callbackItems.find(item => item.Name === 'MpesaReceiptNumber')?.Value as string | undefined;
      const amountPaid = callbackItems.find(item => item.Name === 'Amount')?.Value as number | undefined;

      if (!mpesaReceipt) {
        console.warn(`[M-Pesa Webhook] Warning: Success payload missing receipt string for ${checkoutRequestId}`);
      }

      // 3. IDEMPOTENT DATABASE UPDATE
      // We strictly append `.eq('status', 'pending_payment')`. 
      // If Daraja accidentally sends duplicate webhooks, the second one will harmlessly affect 0 rows.
      const { error } = await supabaseAdmin
        .from('orders')
        .update({
          status: 'paid',
          mpesa_receipt: mpesaReceipt,
          updated_at: new Date().toISOString()
        })
        .eq('mpesa_checkout_id', checkoutRequestId)
        .eq('status', 'pending_payment');

      if (error) {
        // We log the critical error to your server logs, but DO NOT return 500 to Safaricom.
        // Returning 500 causes Daraja to aggressively retry and potentially DDoS the database.
        console.error(`[M-Pesa Webhook] CRITICAL DB Update Failed for ${checkoutRequestId}:`, error);
      } else {
        console.log(`[M-Pesa Webhook] Payment Success! Order ${checkoutRequestId} paid KES ${amountPaid}. Receipt: ${mpesaReceipt}`);
      }

    } else {
      // ====================================================================
      // SCENARIO B: FAILED PAYMENT (Cancelled, Timeout, Insufficient Funds)
      // ====================================================================
      console.warn(`[M-Pesa Webhook] Payment Failed for ${checkoutRequestId}. Reason: ${stkCallback.ResultDesc}`);
      
      // 4. THE RESTOCK ENGINE
      // Automatically triggers the PostgreSQL RPC to return locked inventory to the storefront
      const { error } = await supabaseAdmin.rpc('cancel_and_restock_order', {
        p_mpesa_checkout_id: checkoutRequestId
      });

      if (error) {
        console.error(`[M-Pesa Webhook] CRITICAL Flawless Restock Engine Failed for ${checkoutRequestId}:`, error);
      } else {
        console.log(`[M-Pesa Webhook] Inventory successfully restored for Checkout ID: ${checkoutRequestId}`);
      }
    }

    // 5. SAFARICOM STANDARD RESPONSE
    // Daraja requires a 200 OK with this exact JSON structure to close the connection and stop retrying.
    return NextResponse.json({ 
      ResultCode: 0, 
      ResultDesc: "Accepted" 
    }, { status: 200 });

  } catch (error) {
    console.error('[M-Pesa Webhook] Fatal Server Error:', error);
    // Even during a catastrophic server crash, we tell Daraja we received it so they drop their retry queue.
    return NextResponse.json({ 
      ResultCode: 0, 
      ResultDesc: "Accepted with internal errors" 
    }, { status: 200 });
  }
}