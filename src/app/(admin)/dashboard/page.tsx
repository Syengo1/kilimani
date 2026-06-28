import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { MonitorSmartphone, ArrowRight } from 'lucide-react';
import { AppRole } from '@/app/(admin)/dashboard/layout';
import { MetricGrid, DashboardMetrics } from '@/components/dashboard/MetricGrid';
import { OrderPipeline } from '@/components/dashboard/OrderPipeline';
import { AuthorizationScope } from '@/components/dashboard/AuthorizationScope';

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // 1. Secure Context Extraction
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // 2. PARALLEL DATA FETCHING (Performance Best Practice)
  // We fetch the profile, inventory stats, and daily orders simultaneously to eliminate waterfall latency.
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    { data: profile },
    { data: variants },
    { count: lowStockCount },
    { count: todayOrdersCount }
  ] = await Promise.all([
    supabase.from('staff_profiles').select('role, full_name').eq('id', user.id).single(),
    supabase.from('product_variants').select('stock_quantity'),
    supabase.from('product_variants').select('*', { count: 'exact', head: true }).lt('stock_quantity', 5),
    supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString())
  ]);

  if (!profile || !profile.role) redirect('/');

  const role = profile.role as AppRole;
  const firstName = profile.full_name?.split(' ')[0] || user.user_metadata?.full_name?.split(' ')[0] || 'Team Member';

  // 3. Data Transformation
  // We compute the total stock safely on the server before passing it to the client components.
  const totalStockUnits = variants?.reduce((sum, item) => sum + (item.stock_quantity || 0), 0) || 0;

  // Construct the payload for our smart MetricGrid
  const liveMetrics: DashboardMetrics = {
    revenueMTD: 'KES 0', // TODO: Wire up actual monthly aggregation when Sales module is built
    revenueChange: 'Calculating...',
    ordersProcessed: todayOrdersCount || 0,
    ordersChange: 'Today',
    registerSales: 'KES 0', // TODO: Wire up daily register shifts
    transactions: todayOrdersCount || 0,
    totalStock: totalStockUnits,
    outOfStock: lowStockCount || 0,
    criticalAlerts: lowStockCount || 0, // Using low stock as a critical alert metric for now
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* ========================================== */}
      {/* 1. DYNAMIC WELCOME HEADER                  */}
      {/* ========================================== */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white dark:bg-card p-8 rounded-3xl border border-border shadow-sm">
        <div>
          <h1 className="text-3xl font-serif font-black text-foreground tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="text-muted-foreground mt-2 font-medium flex items-center gap-2">
            System clearance level: 
            <span className="px-2 py-1 rounded-md bg-foreground/5 text-foreground text-[10px] font-mono uppercase font-bold tracking-widest border border-border/50">
              {role.replace('_', ' ')}
            </span>
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-500">
            Network Online
          </span>
        </div>
      </div>

      {/* ========================================== */}
      {/* 2. THE SMART METRIC GRID                   */}
      {/* ========================================== */}
      {/* We pass the live data and the user's role. The grid will automatically format itself. */}
      <MetricGrid userRole={role} metrics={liveMetrics} />

      {/* ========================================== */}
      {/* 3. WORKSPACE MODULES                       */}
      {/* ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LAUNCH POS TERMINAL (Takes full width for Cashiers, 5 cols for Admins) */}
        <div className={`col-span-1 ${role === 'cashier' ? 'lg:col-span-12' : 'lg:col-span-5'}`}>
          <Link 
            href="/admin/pos" 
            className="group relative flex flex-col items-center justify-center gap-6 p-10 h-full bg-stone-950 dark:bg-card rounded-3xl border border-border overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
          >
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-primary/20 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/30 transition-colors" />
            
            <div className="w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center shrink-0 border border-white/10 backdrop-blur-md z-10">
              <MonitorSmartphone size={40} className="text-white" strokeWidth={1.5} />
            </div>
            
            <div className="text-center z-10 px-4">
              <h3 className="text-2xl font-bold text-white tracking-tight">Launch POS Terminal</h3>
              <p className="text-stone-400 mt-2 text-sm max-w-sm mx-auto leading-relaxed">
                Open the Point of Sale interface to process in-store walk-in customers, scan items, and print receipts.
              </p>
            </div>
            
            <div className="absolute bottom-6 right-6 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground group-hover:scale-110 transition-transform z-10 shadow-lg">
              <ArrowRight size={20} strokeWidth={2.5} />
            </div>
          </Link>
        </div>

        {/* LIVE ORDER PIPELINE (Hidden from Cashiers, takes 7 cols for Admins) */}
        {role !== 'cashier' && (
          <div className="col-span-1 lg:col-span-7">
            <OrderPipeline userRole={role} />
          </div>
        )}

      </div>
    </div>
  );
}