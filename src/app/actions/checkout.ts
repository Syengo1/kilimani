'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { calculateDistance, calculateDeliveryFee } from '@/lib/checkout/haversine';
import { initiateSTKPush } from '@/lib/mpesa/daraja';
import { validateCartItems } from './cart';

// 1. STRICT TYPE ALIGNMENT
export type CheckoutCartItem = {
  variant_id: string;
  quantity: number;
  expected_price: number; // Front-end price expectation for security matching
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

/**
 * ENTERPRISE CHECKOUT ENGINE
 * Handles logistics sanitization, security validation, DB transactions, and M-Pesa routing.
 */
export async function processSecureCheckout(payload: CheckoutPayload) {
  // 1. PRE-FLIGHT VALIDATION: Reject empty payloads instantly
  if (!payload.cart_items || payload.cart_items.length === 0) {
    return { success: false, message: "Your cart is empty." };
  }

  // 2. THE SECURITY GATE (Using the new cart validation engine)
  // Ensures prices haven't changed and stock wasn't depleted in the last 5 seconds
  const validationPayload = payload.cart_items.map(item => ({
    variantId: item.variant_id,
    quantity: item.quantity,
    price: item.expected_price
  }));

  const validationResults = await validateCartItems(validationPayload);
  const hasStaleData = validationResults.some(res => !res.isValid);
  
  if (hasStaleData) {
    return { 
      success: false, 
      message: "Cart validation failed. A price or stock level changed while you were checking out. Please review your cart." 
    };
  }

  // 3. M-PESA PHONE SANITIZATION
  // Transforms "0712 345 678", "+254712...", etc. strictly into "254712345678"
  let cleanPhone = payload.customer_phone.replace(/\D/g, '');
  if (cleanPhone.startsWith('0')) cleanPhone = '254' + cleanPhone.slice(1);
  if (cleanPhone.startsWith('254') && cleanPhone.length !== 12) {
    return { success: false, message: "Invalid Kenyan phone number format." };
  }

  const supabase = await createClient(); 
  
  // Admin client required to bypass RLS for fetching true totals and mapping the M-Pesa ID
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 4. STRICT LOGISTICS SANITIZATION & MATHEMATICAL LOCKING
    let deliveryFee = 0;
    let cleanShippingAddress = null;
    let deliveryNotes = null;
    let cleanLat = null;
    let cleanLng = null;
    
    if (payload.delivery_type === 'delivery') {
      if (!payload.latitude || !payload.longitude) {
        throw new Error("Precise GPS coordinates are required for home delivery.");
      }
      
      cleanLat = payload.latitude;
      cleanLng = payload.longitude;
      
      const distance = calculateDistance(cleanLat, cleanLng);
      // Math.round guarantees we pass a clean integer to PostgreSQL
      deliveryFee = Math.round(calculateDeliveryFee(distance)); 

      deliveryNotes = payload.shipping_address?.notes?.trim() || null;
      
      cleanShippingAddress = {
        street: payload.shipping_address?.street?.trim() || '',
        building: payload.shipping_address?.building?.trim() || '',
        city: payload.shipping_address?.city?.trim() || ''
      };
    }

    // Strip out 'expected_price' before passing to Postgres to prevent JSONB bloat
    const dbCartItems = payload.cart_items.map(item => ({
      variant_id: item.variant_id,
      quantity: item.quantity
    }));

    // 5. EXECUTE THE UNBREAKABLE DATABASE TRANSACTION
    const { data: orderRef, error } = await supabase.rpc('process_checkout', {
      p_customer_name: payload.customer_name.trim(),
      p_customer_email: payload.customer_email.trim().toLowerCase(),
      p_customer_phone: cleanPhone,
      p_delivery_type: payload.delivery_type,
      p_shipping_address: cleanShippingAddress,
      p_latitude: cleanLat,
      p_longitude: cleanLng,
      p_delivery_fee: deliveryFee,
      p_cart_items: dbCartItems,
      p_delivery_notes: deliveryNotes
    });

    if (error) {
      console.error("Checkout Transaction Failed:", error);
      const safeMessage = error.message.includes('Insufficient stock') 
        ? "One or more items in your cart just sold out." 
        : "Failed to secure inventory. Please try again.";
      return { success: false, message: safeMessage };
    }

    // 6. FETCH THE TRUE DATABASE-CALCULATED TOTAL
    const { data: orderData, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('total_amount')
      .eq('order_ref', orderRef)
      .single();

    if (fetchError || !orderData || orderData.total_amount <= 0) {
      console.error("Failed to verify financial totals:", fetchError);
      return { success: false, message: "Order secured, but financial verification failed." };
    }

    // Safaricom Daraja API strictly requires whole integers.
    const darajaAmount = Math.round(Number(orderData.total_amount));

    // 7. TRIGGER SAFARICOM STK PUSH
    try {
      const stkResponse = await initiateSTKPush(
        cleanPhone, 
        darajaAmount, 
        orderRef
      );

      // 8. CRITICAL: SAVE M-PESA CHECKOUT ID TO THE DB
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

    // 9. COMPLETE THE LOOP
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