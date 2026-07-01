'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

// ENTERPRISE FIX: Use the Service Role Key to safely bypass RLS for Admin Dashboard data
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function fetchAllOrders() {
  // FIX: Only query columns that actually exist in schema.sql (ref_id, base_attributes)
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select(`
      *,
      order_items (
        id, quantity, unit_price, subtotal,
        product_variants ( 
          sku, 
          products ( id, ref_id, base_attributes, product_type, product_images ( url ) ) 
        )
      ),
      cashier:staff_profiles(full_name)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', JSON.stringify(error, null, 2));
    return [];
  }
  
  return data || [];
}

export async function voidAndRestockOrder(orderId: string) {
  const { data, error } = await supabaseAdmin.rpc('void_and_restock_order', {
    p_order_id: orderId
  });

  if (error || !data) {
    console.error('Error voiding order:', error);
    return { success: false, error: error?.message || 'Failed to void order' };
  }

  revalidatePath('/dashboard/orders');
  return { success: true };
}