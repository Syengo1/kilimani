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
  // 1. Quick exit & Array Bomb Protection
  if (!items || !Array.isArray(items) || items.length === 0) return [];
  if (items.length > 100) {
    console.warn('[Cart Security] Payload exceeded maximum bounds.');
    throw new Error('Cart payload exceeds maximum allowed items.');
  }

  try {
    const supabase = await createClient();
    
    // Extract valid IDs to prevent database query crashes on malformed requests
    const variantIds = items
      .filter(i => i && typeof i.variantId === 'string')
      .map(i => i.variantId);

    if (variantIds.length === 0) return [];

    // 2. FETCH LIVE METRICS
    const { data: variants, error } = await supabase
      .from('product_variants')
      .select('id, stock_quantity, price_kes, discount_price_kes')
      .in('id', variantIds);

    // 3. DATABASE FAIL-SAFE
    // If the database drops connection, we lock the cart safely instead of crashing
    if (error || !variants) {
      console.error('[Cart Validation] Database Interception:', error);
      return items.map(i => ({ 
        variantId: i?.variantId || 'unknown', 
        isValid: false, 
        error: 'OUT_OF_STOCK' 
      }));
    }

    // 4. THE VALIDATION MATRIX
    return items.map(item => {
      // SECURITY FIREWALL: Block manipulated payloads (negative quantities, strings, decimals, NaN)
      if (
        !item || 
        typeof item.variantId !== 'string' || 
        typeof item.quantity !== 'number' ||
        typeof item.price !== 'number' ||
        !Number.isInteger(item.quantity) || 
        item.quantity <= 0
      ) {
        return { 
          variantId: item?.variantId || 'unknown', 
          isValid: false, 
          error: 'OUT_OF_STOCK', 
          liveStock: 0 
        };
      }

      const variant = variants.find(v => v.id === item.variantId);

      // SCENARIO A: The SKU was completely deleted from the database by an admin
      if (!variant) {
        return { 
          variantId: item.variantId, 
          isValid: false, 
          error: 'OUT_OF_STOCK', 
          liveStock: 0 
        };
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
      // If someone else bought the items while they were browsing
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

      // SCENARIO D: Financial Discrepancy 
      // User tried to manipulate the price in local storage, or a flash sale ended/started
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
      // Validates successfully AND seamlessly uplinks the live stock so the frontend 
      // local ceiling (maxStock) is constantly synchronized in the background.
      return { 
        variantId: item.variantId, 
        isValid: true, 
        liveStock: variant.stock_quantity 
      };
    });

  } catch (error) {
    console.error('[Cart Validation] Critical Server Catch:', error);
    // Graceful fallback lock
    return items.map(i => ({ 
      variantId: i?.variantId || 'unknown', 
      isValid: false, 
      error: 'OUT_OF_STOCK' 
    }));
  }
}