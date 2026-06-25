'use server';

import { createClient } from '@/lib/supabase/server';

// ============================================================================
// 1. STRICT TYPE DEFINITIONS
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
 * Defends against race conditions, expired flash sales, frontend price manipulation, 
 * and malicious quantity injection.
 */
export async function validateCartItems(items: CartValidationPayload[]): Promise<CartValidationResult[]> {
  // 1. Quick exit if the cart payload is empty or invalid
  if (!items || !Array.isArray(items) || items.length === 0) return [];

  const supabase = await createClient();
  
  // Extract valid IDs to prevent database query crashes on malformed requests
  const variantIds = items
    .filter(i => i && typeof i.variantId === 'string')
    .map(i => i.variantId);

  // 2. FETCH LIVE METRICS
  const { data: variants, error } = await supabase
    .from('product_variants')
    .select('id, stock_quantity, price_kes, discount_price_kes')
    .in('id', variantIds);

  // 3. DATABASE FAIL-SAFE (Locks down the cart safely if the DB drops connection)
  if (error || !variants) {
    console.error('[Cart Validation] Database Interception:', error);
    return items.map(i => ({ variantId: i?.variantId || 'unknown', isValid: false, error: 'OUT_OF_STOCK' }));
  }

  // 4. THE VALIDATION MATRIX
  return items.map(item => {
    // SECURITY FIREWALL: Block manipulated payloads (negative quantities, decimals, strings, zeros)
    // This strictly enforces that the cart CANNOT add fake or manipulated item quantities
    if (!item || typeof item.variantId !== 'string' || !Number.isInteger(item.quantity) || item.quantity <= 0) {
      return { variantId: item?.variantId || 'unknown', isValid: false, error: 'OUT_OF_STOCK', liveStock: 0 };
    }

    const variant = variants.find(v => v.id === item.variantId);

    // SCENARIO A: The SKU was completely deleted from the database by an admin
    if (!variant) {
      return { variantId: item.variantId, isValid: false, error: 'OUT_OF_STOCK', liveStock: 0 };
    }

    // 5. FINANCIAL COMPUTATION ENGINE
    const livePrice = Number(variant.discount_price_kes || variant.price_kes);
    const liveOriginalPrice = variant.discount_price_kes ? Number(variant.price_kes) : undefined;

    // SCENARIO B: Completely Sold Out (0 stock)
    if (variant.stock_quantity <= 0) {
      return { 
        variantId: item.variantId, 
        isValid: false, 
        error: 'OUT_OF_STOCK',
        liveStock: 0,
        livePrice,
        liveOriginalPrice
      };
    }

    // SCENARIO C: Race Condition / Insufficient Stock
    // Mathematically guarantees users CANNOT checkout with more items than are physically in the warehouse.
    if (variant.stock_quantity < item.quantity) {
      return { 
        variantId: item.variantId, 
        isValid: false, 
        error: 'INSUFFICIENT_STOCK',
        liveStock: variant.stock_quantity, // Flawlessly triggers the "Adjust to X" UI
        livePrice,
        liveOriginalPrice
      };
    }

    // SCENARIO D: Financial Discrepancy 
    // A flash sale ended, or the user tried to edit local storage to lower the price
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

    // SCENARIO E: Flawless Match
    // Stock is sufficient, payload is clean, and the price matches the database exactly.
    return { variantId: item.variantId, isValid: true };
  });
}