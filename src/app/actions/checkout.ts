'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { calculateDistance, calculateDeliveryFee } from '@/lib/checkout/haversine';
import { initiateSTKPush } from '@/lib/mpesa/daraja'; // 1. IMPORT DARAJA ENGINE

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
  // 1. Initialize Clients
  const supabase = await createClient(); // Standard client for the RPC transaction
  
  // Admin client required to bypass RLS for fetching the true total and updating the checkout ID
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 2. Calculate Delivery Fee Securely on the Server
    let deliveryFee = 0;
    
    if (payload.delivery_type === 'delivery') {
      if (!payload.latitude || !payload.longitude) {
        throw new Error("Location coordinates are required for delivery.");
      }
      const distance = calculateDistance(payload.latitude, payload.longitude);
      deliveryFee = calculateDeliveryFee(distance);
    }

    // 3. Execute the Unbreakable Database Transaction
    // (This securely deducts inventory, handles math, and generates the Order Ref)
    const { data: orderRef, error } = await supabase.rpc('process_checkout', {
      p_customer_name: payload.customer_name,
      p_customer_email: payload.customer_email,
      p_customer_phone: payload.customer_phone,
      p_delivery_type: payload.delivery_type,
      p_shipping_address: payload.shipping_address || null,
      p_latitude: payload.latitude || null,
      p_longitude: payload.longitude || null,
      p_delivery_fee: deliveryFee,
      p_cart_items: payload.cart_items
    });

    if (error) {
      console.error("Checkout Transaction Failed:", error);
      return { success: false, message: error.message };
    }

    // 4. FETCH THE TRUE DATABASE-CALCULATED TOTAL
    // (We strictly use the database amount, never trusting the frontend cart math)
    const { data: orderData, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('total_amount')
      .eq('order_ref', orderRef)
      .single();

    if (fetchError || !orderData) {
      console.error("Failed to fetch order total:", fetchError);
      return { success: false, message: "Order secured, but financial verification failed." };
    }

    // 5. TRIGGER SAFARICOM STK PUSH
    try {
      const stkResponse = await initiateSTKPush(
        payload.customer_phone, 
        orderData.total_amount, 
        orderRef
      );

      // 6. CRITICAL: SAVE THE SAFARICOM CHECKOUT ID TO THE DATABASE
      // We must use the Admin Client here because our RLS rules block normal clients from updating orders.
      const { error: updateError } = await supabaseAdmin
        .from('orders')
        .update({ mpesa_checkout_id: stkResponse.checkoutRequestId })
        .eq('order_ref', orderRef);

      if (updateError) {
        console.error("Critical: Failed to save M-Pesa Request ID:", updateError);
        throw new Error("Database failed to link transaction. Please try again.");
      }

    } catch (stkError: unknown) {
      console.error("Daraja STK Push Failed:", stkError);
      
      const errorMessage = stkError instanceof Error 
        ? stkError.message 
        : "Failed to connect to Safaricom. Please ensure your phone is on and try again.";
        
      return { success: false, message: errorMessage };
    }

    // 7. Complete the Loop
    return { 
      success: true, 
      orderRef: orderRef,
      message: "Inventory secured. Prompt sent to phone."
    };

  } catch (err: unknown) {
    console.error("Secure Checkout Exception:", err);
    
    const errorMessage = err instanceof Error 
      ? err.message 
      : "An unexpected system error occurred during checkout.";
      
    return { success: false, message: errorMessage };
  }
}