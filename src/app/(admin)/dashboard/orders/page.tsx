import { fetchAllOrders } from '@/app/actions/orders';
import { OrdersClient } from './OrdersClient';
import { createClient } from '@/lib/supabase/server';

export default async function OrdersPage() {
  const orders = await fetchAllOrders();
  
  // Check role to ensure only Super Admins can void orders
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase.from('staff_profiles').select('role').eq('id', user.id).single();
    isAdmin = profile?.role === 'super_admin' || profile?.role === 'admin';
  }

  return (
    <div className="flex flex-col h-full bg-stone-50 dark:bg-background">
      <div className="p-6 md:p-8 border-b border-border/50 bg-background shrink-0">
        <h1 className="text-3xl font-serif font-black tracking-tight text-foreground">Order Management</h1>
        <p className="text-sm font-medium text-muted-foreground mt-1">
          Monitor, filter, and manage all POS and Website transactions.
        </p>
      </div>

      <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
        <OrdersClient initialOrders={orders} isAdmin={isAdmin} />
      </div>
    </div>
  );
}