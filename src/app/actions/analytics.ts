'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface AnalyticsPayload {
  financials: { total: number; pos: number; web: number; aov: number };
  chartData: { date: string; revenue: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
  staff: { id: string; name: string; revenue: number; orderCount: number }[];
  insights: { type: 'success' | 'warning' | 'info'; message: string }[];
}

// ==========================================
// STRICT TYPES TO FIX ESLINT & TS ERRORS
// ==========================================
interface SupabaseProduct {
  ref_id: string;
  base_attributes?: Record<string, unknown>; // Safely typed JSONB column
}

interface SupabaseVariant {
  sku: string;
  products?: SupabaseProduct | SupabaseProduct[];
}

interface AnalyticsOrderItem {
  quantity: number;
  subtotal: number;
  product_variants?: SupabaseVariant | SupabaseVariant[];
}

export async function fetchAnalyticsData(days: number = 30): Promise<AnalyticsPayload> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // 1. Fetch Orders WITH line items 
  // FIX: Schema alignment (ref_id, base_attributes) and chronological ordering
  const { data: ordersRes, error } = await supabaseAdmin
    .from('orders')
    .select(`
      created_at, total_amount, origin, payment_method, status, cashier_id,
      cashier:staff_profiles(full_name),
      order_items( quantity, subtotal, product_variants( sku, products( ref_id, base_attributes ) ) )
    `)
    .neq('status', 'cancelled')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true }); // Guarantees Left-to-Right chart rendering

  // FIX: Failsafe Error Logging. No more silent failures.
  if (error) {
    console.error('[Analytics DB Error]:', JSON.stringify(error, null, 2));
  }

  const orders = ordersRes || [];

  // 2. Data Structures for Aggregation
  const financials = { total: 0, pos: 0, web: 0, aov: 0 };
  const salesByDate = new Map<string, number>();
  const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();
  const staffMap = new Map<string, { id: string; name: string; revenue: number; orderCount: number }>();
  const hourTally = new Array(24).fill(0);

  // 3. The Great Aggregation Loop
  orders.forEach(o => {
    const total = Number(o.total_amount) || 0;
    const dateStr = new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const hour = new Date(o.created_at).getHours();

    // Financials
    financials.total += total;
    if (o.origin === 'pos') financials.pos += total;
    if (o.origin === 'web') financials.web += total;
    
    // Time-Series (Chart) & Peak Hours
    salesByDate.set(dateStr, (salesByDate.get(dateStr) || 0) + total);
    hourTally[hour] += 1;

    // STAFF WORKRATE (Safe array extraction)
    if (o.cashier_id && o.cashier) {
      const cashierData = Array.isArray(o.cashier) ? o.cashier[0] : o.cashier;
      const cashierName = cashierData?.full_name || 'Unknown Staff';
      
      const staff = staffMap.get(o.cashier_id) || { id: o.cashier_id, name: cashierName, revenue: 0, orderCount: 0 };
      staff.revenue += total;
      staff.orderCount += 1;
      staffMap.set(o.cashier_id, staff);
    }

    // TOP PRODUCTS (Strictly typed extraction)
    const items = o.order_items as AnalyticsOrderItem[] | undefined;
    
    items?.forEach((item) => {
      // Safely unwrap the nested arrays that Supabase might return
      const variant = Array.isArray(item.product_variants) ? item.product_variants[0] : item.product_variants;
      const product = Array.isArray(variant?.products) ? variant?.products[0] : variant?.products;
      
      // FIX: Secure, strongly-typed JSONB extraction for the product name
      let pName = 'Unknown Item';
      if (product?.base_attributes && typeof product.base_attributes === 'object') {
         const attrs = product.base_attributes as Record<string, unknown>;
         if (typeof attrs.name === 'string') pName = attrs.name;
         else if (typeof attrs.title === 'string') pName = attrs.title;
      }
      // Fallback hierarchy if JSONB name is missing
      if (pName === 'Unknown Item' && product?.ref_id) pName = product.ref_id;
      if (pName === 'Unknown Item' && variant?.sku) pName = variant.sku;
      
      const prod = productMap.get(pName) || { name: pName, quantity: 0, revenue: 0 };
      prod.quantity += Number(item.quantity) || 0;
      prod.revenue += Number(item.subtotal) || 0;
      productMap.set(pName, prod);
    });
  });

  // Calculate Average Order Value (AOV)
  financials.aov = orders.length > 0 ? financials.total / orders.length : 0;

  // 4. Smart Insights Engine
  const insights: AnalyticsPayload['insights'] = [];
  const peakHour = hourTally.indexOf(Math.max(...hourTally));
  
  if (orders.length > 0) {
    insights.push({ 
      type: 'info', 
      message: `Your peak trading hour is ${peakHour}:00. Ensure you have optimal staffing during this period.` 
    });
  }

  if (financials.web > financials.pos) {
    insights.push({ type: 'success', message: 'Online sales have surpassed in-store POS sales for this period!' });
  }

  return {
    financials,
    // JS Map preserves chronological insertion order because of our DB query ordering
    chartData: Array.from(salesByDate.entries()).map(([date, revenue]) => ({ date, revenue })),
    topProducts: Array.from(productMap.values()).sort((a, b) => b.quantity - a.quantity).slice(0, 5),
    staff: Array.from(staffMap.values()).sort((a, b) => b.revenue - a.revenue),
    insights
  };
}