'use server';

import { createClient } from '@/lib/supabase/server';
import { OfflineOrderPayload } from '@/components/pos/store/posStore';

export async function syncOfflineOrders(orders: OfflineOrderPayload[]) {
  if (!orders || orders.length === 0) return [];

  const supabase = await createClient();
  const results = [];

  for (const order of orders) {
    try {
      // Execute the Secure POS RPC created in Phase 1
      const { data, error } = await supabase.rpc('process_pos_checkout', {
        p_cashier_id: order.cashierId,
        p_payment_method: order.paymentMethod,
        p_amount_cash: order.amountCash,
        p_amount_mpesa: order.amountMpesa,
        p_mpesa_receipt: order.mpesaReceipt || null,
        p_cart_items: order.items,
        p_offline_timestamp: order.timestamp,
      });

      if (error) {
        console.error(`[Sync Error] Order ${order.localId}:`, error.message);
        results.push({ localId: order.localId, success: false, error: error.message });
      } else {
        results.push({ localId: order.localId, success: true, orderRef: data });
      }
    } catch (err) {
      console.error(`[Sync Exception] Order ${order.localId}:`, err);
      results.push({ localId: order.localId, success: false, error: 'Internal Server Error' });
    }
  }

  return results;
}