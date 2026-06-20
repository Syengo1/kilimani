import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 1. STRICT TYPING: Define the exact shape of Safaricom's Callback Items
interface MpesaCallbackItem {
  Name: string;
  Value?: string | number;
}

// WARNING: Use the Service Role Key here to bypass RLS, because this request comes from Safaricom.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const stkCallback = data.Body?.stkCallback;

    if (!stkCallback) {
      return NextResponse.json({ error: 'Invalid Payload' }, { status: 400 });
    }

    const checkoutRequestId = stkCallback.CheckoutRequestID as string;
    const resultCode = stkCallback.ResultCode as number;

    // ResultCode 0 means the customer entered their PIN and the payment was successful
    if (resultCode === 0 && stkCallback.CallbackMetadata?.Item) {
      // 2. APPLY TYPES: Cast the array to our strictly defined interface
      const callbackItems: MpesaCallbackItem[] = stkCallback.CallbackMetadata.Item;
      
      // ESLINT FIXED: Safely extract values without using 'any'
      const receiptObj = callbackItems.find((item: MpesaCallbackItem) => item.Name === 'MpesaReceiptNumber');
      const amountObj = callbackItems.find((item: MpesaCallbackItem) => item.Name === 'Amount');
      
      const mpesaReceipt = receiptObj?.Value as string | undefined;
      const amountPaid = amountObj?.Value as number | undefined;

      // UPDATE THE DATABASE: Mark as paid and attach the receipt!
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          mpesa_receipt: mpesaReceipt,
          updated_at: new Date().toISOString()
        })
        .eq('mpesa_checkout_id', checkoutRequestId); // We find the order using the Safaricom ID!

      if (error) {
        console.error('Database Update Failed during Webhook:', error);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }

      console.log(`Payment Success! Order matching ${checkoutRequestId} paid KES ${amountPaid}. Receipt: ${mpesaReceipt}`);
    
    } else {
      // ResultCode !== 0 means the user cancelled, timed out, or had insufficient funds.
      console.log(`Payment Failed for ${checkoutRequestId}. Reason: ${stkCallback.ResultDesc}`);
      
      // TRIGGER THE FLAWLESS RESTOCK ENGINE
      // This securely cancels the order AND restores the exact inventory quantities in one unbreakable database transaction.
      const { error } = await supabase.rpc('cancel_and_restock_order', {
        p_mpesa_checkout_id: checkoutRequestId
      });

      if (error) {
        console.error('Flawless Restock Engine Failed:', error);
        // We log the error but still return a 200 OK to Safaricom so they stop retrying
      } else {
        console.log(`Inventory successfully restored for Checkout ID: ${checkoutRequestId}`);
      }
    }

    // 3. SAFARICOM STANDARD: Daraja expects this exact key-value response to stop retrying
    return NextResponse.json({ 
      ResultCode: 0, 
      ResultDesc: "Success" 
    });

  } catch (error) {
    console.error('Webhook Error:', error);
    // Even on server crashes, returning a Safaricom-formatted error is safer
    return NextResponse.json({ 
      ResultCode: 1, 
      ResultDesc: "Internal Server Error" 
    }, { status: 500 });
  }
}