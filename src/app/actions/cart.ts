'use server';

import { createClient } from '@/lib/supabase/server';

export interface CartValidationResult {
  variantId: string;
  isValid: boolean;
  livePrice: number;
  liveStock: number;
  error?: 'PRICE_CHANGED' | 'OUT_OF_STOCK' | 'INSUFFICIENT_STOCK' | 'NOT_FOUND';
}

export async function validateCartItems(
  cartItems: { variantId: string; price: number; quantity: number }[]
): Promise<CartValidationResult[]> {
  if (!cartItems.length) return [];

  const supabase = await createClient();
  const variantIds = cartItems.map((item) => item.variantId);

  // Fetch the absolute live truth from the database
  const { data: liveVariants, error } = await supabase
    .from('product_variants')
    .select('id, price_kes, stock_quantity, is_active')
    .in('id', variantIds);

  if (error || !liveVariants) {
    console.error('Cart validation error:', error);
    throw new Error('Failed to validate cart data.');
  }

  return cartItems.map((item) => {
    const liveData = liveVariants.find((v) => v.id === item.variantId);

    // 1. Variant no longer exists or was deactivated
    if (!liveData || !liveData.is_active) {
      return { variantId: item.variantId, isValid: false, livePrice: 0, liveStock: 0, error: 'NOT_FOUND' };
    }

    // 2. Price Mismatch (Protects your margins)
    if (liveData.price_kes !== item.price) {
      return { variantId: item.variantId, isValid: false, livePrice: liveData.price_kes, liveStock: liveData.stock_quantity, error: 'PRICE_CHANGED' };
    }

    // 3. Complete Stockout
    if (liveData.stock_quantity === 0) {
      return { variantId: item.variantId, isValid: false, livePrice: liveData.price_kes, liveStock: 0, error: 'OUT_OF_STOCK' };
    }

    // 4. Insufficient Stock (User wants 3, but only 1 is left)
    if (item.quantity > liveData.stock_quantity) {
      return { variantId: item.variantId, isValid: false, livePrice: liveData.price_kes, liveStock: liveData.stock_quantity, error: 'INSUFFICIENT_STOCK' };
    }

    // Everything is perfect
    return { variantId: item.variantId, isValid: true, livePrice: liveData.price_kes, liveStock: liveData.stock_quantity };
  });
}