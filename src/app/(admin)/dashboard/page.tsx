import { redirect } from 'next/navigation';
import Link from 'next/link';
// FIX 1: Import the standard Supabase JS client and alias it to prevent collision
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { MonitorSmartphone, ArrowRight } from 'lucide-react';
import { AppRole } from '@/app/(admin)/dashboard/layout';
import { MetricGrid, DashboardMetrics } from '@/components/dashboard/MetricGrid';
import { OrderPipeline, PipelineOrder } from '@/components/dashboard/OrderPipeline';

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // 1. Secure Context
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // 2. High-Performance Parallel Aggregation
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // FIX 2: Use the Aliased Admin Client to properly bypass RLS without Promise errors
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [
    { data: profile },
    { data: variants },
    { data: todayOrders },
    { data: monthOrders }
  ] = await Promise.all([
    supabase.from('staff_profiles').select('role, full_name').eq('id', user.id).single(),
    supabaseAdmin.from('product_variants').select('stock_quantity'),
    supabaseAdmin.from('orders').select('id, order_ref, customer_name, total_amount, status, origin, created_at').gte('created_at', startOfDay).order('created_at', { ascending: false }),
    supabaseAdmin.from('orders').select('total_amount').gte('created_at', startOfMonth).neq('status', 'cancelled')
  ]);

  if (!profile || !profile.role) redirect('/');

  const role = profile.role as AppRole;
  const firstName = profile.full_name?.split(' ')[0] || user.user_metadata?.full_name?.split(' ')[0] || 'Team Member';

  // 3. Mathematical Calculations
  const safeTodayOrders = todayOrders || [];
  const safeMonthOrders = monthOrders || [];
  
  // FIX 3: Apply Strict Inline Typing to all array parameters to satisfy TS7006
  const totalStockUnits = variants?.reduce((sum: number, item: { stock_quantity: number | null }) => sum + (item.stock_quantity || 0), 0) || 0;
  const lowStockCount = variants?.filter((v: { stock_quantity: number | null }) => (v.stock_quantity || 0) <= 5 && (v.stock_quantity || 0) > 0).length || 0;
  const outOfStockCount = variants?.filter((v: { stock_quantity: number | null }) => (v.stock_quantity || 0) <= 0).length || 0;
  
  const revenueMTD = safeMonthOrders.reduce((sum: number, o: { total_amount: string | number | null }) => sum + Number(o.total_amount || 0), 0);
  
  const validTodayPosOrders = safeTodayOrders.filter((o: { origin: string; status: string }) => o.origin === 'pos' && o.status !== 'cancelled');
  const registerSales = validTodayPosOrders.reduce((sum: number, o: { total_amount: string | number | null }) => sum + Number(o.total_amount || 0), 0);

  // 4. Construct Payload
  const liveMetrics: DashboardMetrics = {
    revenueMTD: `KES ${revenueMTD.toLocaleString()}`,
    revenueChange: 'This Month',
    ordersProcessed: safeTodayOrders.length,
    ordersChange: 'Today',
    registerSales: `KES ${registerSales.toLocaleString()}`,
    transactions: validTodayPosOrders.length,
    totalStock: totalStockUnits,
    outOfStock: outOfStockCount,
    criticalAlerts: outOfStockCount + lowStockCount, 
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-card p-6 md:p-8 rounded-3xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-black text-foreground tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="text-muted-foreground mt-1 md:mt-2 font-medium flex items-center gap-2 text-sm">
            System clearance level: 
            <span className="px-2 py-0.5 md:py-1 rounded-md bg-foreground/5 text-foreground text-[9px] md:text-[10px] font-mono uppercase font-bold tracking-widest border border-border/50">
              {role.replace('_', ' ')}
            </span>
          </p>
        </div>
        
        <div className="flex items-center justify-center gap-2 md:gap-3 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-2.5 md:py-2 rounded-xl border border-emerald-500/20 shrink-0">
          <div className="h-2 w-2 md:h-2.5 md:w-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-500">
            Network Online
          </span>
        </div>
      </div>

      {/* 2. THE SMART METRIC GRID */}
      <MetricGrid userRole={role} metrics={liveMetrics} />

      {/* 3. WORKSPACE MODULES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        
        {/* LAUNCH POS TERMINAL */}
        <div className={`col-span-1 ${role === 'cashier' ? 'lg:col-span-12' : 'lg:col-span-5'}`}>
          <Link 
            href="/dashboard/pos" 
            className="group relative flex flex-col items-center justify-center gap-6 p-8 md:p-10 h-full min-h-[300px] bg-stone-950 dark:bg-card rounded-3xl border border-border overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 w-72 h-72 bg-primary/20 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/30 transition-colors" />
            
            <div className="w-20 h-20 md:w-24 md:h-24 bg-white/5 rounded-3xl flex items-center justify-center shrink-0 border border-white/10 backdrop-blur-md z-10">
              <MonitorSmartphone size={40} className="text-white" strokeWidth={1.5} />
            </div>
            
            <div className="text-center z-10 px-4">
              <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">Launch POS Terminal</h3>
              <p className="text-stone-400 mt-2 text-xs md:text-sm max-w-sm mx-auto leading-relaxed">
                Open the Point of Sale interface to process in-store walk-in customers, scan items, and print receipts.
              </p>
            </div>
            
            <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground group-hover:scale-110 transition-transform z-10 shadow-lg">
              <ArrowRight size={20} strokeWidth={2.5} />
            </div>
          </Link>
        </div>

        {/* LIVE ORDER PIPELINE */}
        {role !== 'cashier' && (
          <div className="col-span-1 lg:col-span-7 h-[400px] lg:h-auto">
            {/* Slice the array to only pass the 5 most recent orders to the UI */}
            <OrderPipeline userRole={role} orders={safeTodayOrders.slice(0, 5) as PipelineOrder[]} />
          </div>
        )}

      </div>
    </div>
  );
}