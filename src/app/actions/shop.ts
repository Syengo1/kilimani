'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface ShopFilterParams {
  category?: string;
  sort?: 'price_asc' | 'price_desc' | 'newest';
  search?: string;
}

// Strict Types to prevent ESLint 'any' errors during sorting
interface Variant {
  price_kes?: number;
}
interface ProductRecord {
  product_variants?: Variant[] | null;
}

export async function fetchShopProducts(params: ShopFilterParams) {
  // FIX 1: Updated the select query to use 'price_kes' perfectly matching schema.sql
  let query = supabaseAdmin
    .from('products')
    .select(`
      id,
      name,
      ref_id,
      product_type,
      description,
      base_attributes,
      product_images ( url ),
      product_variants ( id, price_kes, stock_quantity )
    `);

  if (params.category && params.category !== 'all') {
    query = query.eq('product_type', params.category);
  }
  
  if (params.sort === 'newest') {
    query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Shop DB Error]:', JSON.stringify(error, null, 2));
    return [];
  }

  const products = data || [];

  // FIX 2: Updated the sorting logic to use 'price_kes' instead of 'price'
  if (params.sort === 'price_asc') {
    products.sort((a: ProductRecord, b: ProductRecord) => {
      const priceA = a.product_variants?.[0]?.price_kes || 0;
      const priceB = b.product_variants?.[0]?.price_kes || 0;
      return priceA - priceB;
    });
  } else if (params.sort === 'price_desc') {
    products.sort((a: ProductRecord, b: ProductRecord) => {
      const priceA = a.product_variants?.[0]?.price_kes || 0;
      const priceB = b.product_variants?.[0]?.price_kes || 0;
      return priceB - priceA;
    });
  }

  return products;
}