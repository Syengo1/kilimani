'use server';

import { createClient } from '@/lib/supabase/server';

// ============================================================================
// 1. STRICT TYPE DEFINITIONS
// Ensures the frontend CartContext and backend validation speak the exact same language.
// ============================================================================

export interface CartValidationPayload {
  variantId: string;
  price: number;
  quantity: number;
}

export interface CartValidationResult {
  variantId: string;
  isValid: boolean;
  error?: 'OUT_OF_STOCK' | 'PRICE_CHANGED' | 'INSUFFICIENT_STOCK';
  liveStock?: number;
  livePrice?: number;
  liveOriginalPrice?: number; 
}

// ============================================================================
// 2. ENTERPRISE VALIDATION ENGINE
// ============================================================================

/**
 * Validates the user's cart against live database metrics before allowing checkout.
 * Defends against race conditions, expired flash sales, and frontend price manipulation.
 */
export async function validateCartItems(items: CartValidationPayload[]): Promise<CartValidationResult[]> {
  // 1. Quick exit if the cart is empty to save database reads
  if (!items || items.length === 0) return [];

  const supabase = await createClient();
  const variantIds = items.map(i => i.variantId);

  // 2. FETCH LIVE METRICS
  // We only pull the absolute minimum data required for financial and inventory validation
  const { data: variants, error } = await supabase
    .from('product_variants')
    .select('id, stock_quantity, price_kes, discount_price_kes')
    .in('id', variantIds);

  // 3. DATABASE FAIL-SAFE
  // If the database connection drops, we gracefully lock down the cart to prevent overselling
  if (error || !variants) {
    console.error('Cart Validation Database Interception:', error);
    return items.map(i => ({ variantId: i.variantId, isValid: false, error: 'OUT_OF_STOCK' }));
  }

  // 4. THE VALIDATION MATRIX
  return items.map(item => {
    const variant = variants.find(v => v.id === item.variantId);

    // SCENARIO A: The SKU was completely deleted from the database by an admin
    if (!variant) {
      return { variantId: item.variantId, isValid: false, error: 'OUT_OF_STOCK' };
    }

    // 5. FINANCIAL COMPUTATION ENGINE
    // Determine the true active price the customer should be paying right now
    const livePrice = Number(variant.discount_price_kes || variant.price_kes);
    // Determine the original price ONLY if a discount is currently active
    const liveOriginalPrice = variant.discount_price_kes ? Number(variant.price_kes) : undefined;

    // SCENARIO B: Race Condition (Someone else bought the last unit while it was in this user's cart)
    if (variant.stock_quantity < item.quantity) {
      return { 
        variantId: item.variantId, 
        isValid: false, 
        error: 'INSUFFICIENT_STOCK',
        liveStock: variant.stock_quantity,
        livePrice,
        liveOriginalPrice
      };
    }

    // SCENARIO C: Financial Discrepancy (A flash sale ended, or the user tried to manipulate the React state)
    if (livePrice !== item.price) {
      return { 
        variantId: item.variantId, 
        isValid: false, 
        error: 'PRICE_CHANGED',
        livePrice,
        liveOriginalPrice,
        liveStock: variant.stock_quantity
      };
    }

    // SCENARIO D: Flawless Match
    // The item is in stock and the pricing is mathematically accurate. Safe to purchase.
    return { variantId: item.variantId, isValid: true };
  });
}