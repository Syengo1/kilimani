'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { calculateDistance, calculateDeliveryFee } from '@/lib/checkout/haversine';
import { initiateSTKPush } from '@/lib/mpesa/daraja';

export type CheckoutCartItem = {
  variant_id: string;
  quantity: number;
};

export interface ShippingAddress {
  street?: string;
  building?: string;
  city?: string;
  notes?: string;
  [key: string]: unknown; 
}

export type CheckoutPayload = {
  customer_name: string;
  customer_email: string;
  customer_phone: string; 
  delivery_type: 'pickup' | 'delivery';
  shipping_address?: ShippingAddress | null; 
  latitude?: number;
  longitude?: number;
  cart_items: CheckoutCartItem[];
};

export async function processSecureCheckout(payload: CheckoutPayload) {
  // 1. PRE-FLIGHT VALIDATION: Instantly reject empty carts
  if (!payload.cart_items || payload.cart_items.length === 0) {
    return { success: false, message: "Your cart is empty." };
  }

  const supabase = await createClient(); 
  
  // Admin client required to bypass RLS for fetching true totals and mapping the M-Pesa ID
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 2. STRICT LOGISTICS SANITIZATION & MATHEMATICAL LOCKING
    let deliveryFee = 0;
    let cleanShippingAddress = null;
    let deliveryNotes = null;
    let cleanLat = null;
    let cleanLng = null;
    
    if (payload.delivery_type === 'delivery') {
      // The schema will violently reject the order if these are missing, so we catch it early
      if (!payload.latitude || !payload.longitude) {
        throw new Error("Precise GPS coordinates are required for home delivery.");
      }
      
      cleanLat = payload.latitude;
      cleanLng = payload.longitude;
      
      const distance = calculateDistance(cleanLat, cleanLng);
      // Math.round guarantees we pass a clean integer to PostgreSQL to prevent decimal constraint failures
      deliveryFee = Math.round(calculateDeliveryFee(distance)); 

      // Isolate notes for the new dedicated DB column
      deliveryNotes = payload.shipping_address?.notes?.trim() || null;
      
      // Construct a purely geographical JSONB object
      cleanShippingAddress = {
        street: payload.shipping_address?.street?.trim() || '',
        building: payload.shipping_address?.building?.trim() || '',
        city: payload.shipping_address?.city?.trim() || ''
      };
    }

    // 3. EXECUTE THE UNBREAKABLE DATABASE TRANSACTION
    const { data: orderRef, error } = await supabase.rpc('process_checkout', {
      p_customer_name: payload.customer_name.trim(),
      p_customer_email: payload.customer_email.trim().toLowerCase(),
      p_customer_phone: payload.customer_phone.trim(),
      p_delivery_type: payload.delivery_type,
      p_shipping_address: cleanShippingAddress,
      p_latitude: cleanLat,
      p_longitude: cleanLng,
      p_delivery_fee: deliveryFee,
      p_cart_items: payload.cart_items,
      p_delivery_notes: deliveryNotes // Sent to the newly created parameter
    });

    if (error) {
      console.error("Checkout Transaction Failed:", error);
      // Translate complex DB constraint errors into user-friendly UI notifications
      const safeMessage = error.message.includes('Insufficient stock') 
        ? "One or more items in your cart just sold out. Please review your cart." 
        : "Failed to secure inventory. Please try again.";
      return { success: false, message: safeMessage };
    }

    // 4. FETCH THE TRUE DATABASE-CALCULATED TOTAL
    // We strictly use the database amount, never trusting the frontend cart math
    const { data: orderData, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('total_amount')
      .eq('order_ref', orderRef)
      .single();

    if (fetchError || !orderData || orderData.total_amount <= 0) {
      console.error("Failed to verify financial totals:", fetchError);
      return { success: false, message: "Order secured, but financial verification failed." };
    }

    // Safaricom Daraja API strictly requires whole integers. Decimal totals crash the prompt.
    const darajaAmount = Math.round(Number(orderData.total_amount));

    // 5. TRIGGER SAFARICOM STK PUSH
    try {
      const stkResponse = await initiateSTKPush(
        payload.customer_phone.trim(), 
        darajaAmount, 
        orderRef
      );

      // 6. CRITICAL: SAVE M-PESA CHECKOUT ID TO THE DB
      const { error: updateError } = await supabaseAdmin
        .from('orders')
        .update({ mpesa_checkout_id: stkResponse.checkoutRequestId })
        .eq('order_ref', orderRef);

      if (updateError) {
        throw new Error("Failed to map Safaricom transaction ID. DB Error.");
      }

    } catch (stkError: unknown) {
      console.error("Daraja STK Push Failed:", stkError);
      const errorMessage = stkError instanceof Error ? stkError.message : "Failed to trigger M-Pesa prompt.";
      return { success: false, message: errorMessage };
    }

    // 7. COMPLETE THE LOOP
    return { 
      success: true, 
      orderRef: orderRef,
      message: "Inventory secured. Prompt sent to phone."
    };

  } catch (err: unknown) {
    console.error("Secure Checkout Exception:", err);
    const errorMessage = err instanceof Error ? err.message : "An unexpected system error occurred.";
    return { success: false, message: errorMessage };
  }
}

export async function checkOrderStatus(orderRef: string) {
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('status')
    .eq('order_ref', orderRef)
    .single();

  if (error) return null;
  return data?.status;
}