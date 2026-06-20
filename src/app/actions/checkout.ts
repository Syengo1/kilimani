'use server';

import { createClient } from '@/lib/supabase/server';
import { calculateDistance, calculateDeliveryFee } from '@/lib/checkout/haversine';

export type CheckoutCartItem = {
  variant_id: string;
  quantity: number;
};

// 1. STRICT TYPING FIX: Replaced 'any' with a secure, defined interface.
// This allows specific fields while safely supporting flexible JSONB data via [key: string]: unknown.
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
  customer_phone: string; // Must be validated frontend side (e.g. 2547...)
  delivery_type: 'pickup' | 'delivery';
  shipping_address?: ShippingAddress | null; // ERROR 1 FIXED
  latitude?: number;
  longitude?: number;
  cart_items: CheckoutCartItem[];
};

export async function processSecureCheckout(payload: CheckoutPayload) {
  const supabase = await createClient();

  try {
    // 1. Calculate Delivery Fee Securely on the Server
    let deliveryFee = 0;
    
    if (payload.delivery_type === 'delivery') {
      if (!payload.latitude || !payload.longitude) {
        throw new Error("Location coordinates are required for delivery.");
      }
      const distance = calculateDistance(payload.latitude, payload.longitude);
      deliveryFee = calculateDeliveryFee(distance);
    }

    // 2. Execute the Unbreakable Database Transaction
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
      // Supabase throws our custom exceptions here (e.g., "Insufficient stock")
      console.error("Checkout Transaction Failed:", error);
      return { success: false, message: error.message };
    }

    // 3. Return the generated Order ID to proceed to M-Pesa
    return { 
      success: true, 
      orderRef: orderRef,
      message: "Inventory secured. Proceeding to payment."
    };

  // 2. STRICT ERROR HANDLING: Replaced 'any' with 'unknown'
  } catch (err: unknown) { // ERROR 2 FIXED
    console.error("Secure Checkout Exception:", err);
    
    // Safely verify that the unknown error is actually an Error object before reading its message
    const errorMessage = err instanceof Error 
      ? err.message 
      : "An unexpected system error occurred during checkout.";
      
    return { success: false, message: errorMessage };
  }
}