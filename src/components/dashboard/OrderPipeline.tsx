'use client';

import { Plus, ChevronRight, Clock, CheckCircle2, AlertCircle, Ban } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthorizationScope } from './AuthorizationScope';
import { AppRole } from '@/app/(admin)/dashboard/layout';

export interface PipelineOrder {
  id: string;
  order_ref: string;
  customer_name: string;
  total_amount: number;
  status: string;
  created_at: string;
}

const getStatusConfig = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized === 'completed' || normalized === 'success') return { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', label: 'Completed' };
  if (normalized === 'cancelled' || normalized === 'voided') return { icon: Ban, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Cancelled' };
  return { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', label: 'Processing' };
};

function OrderRow({ order }: { order: PipelineOrder }) {
  const config = getStatusConfig(order.status);
  const StatusIcon = config.icon;
  const time = new Date(order.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
      className="group flex items-center justify-between p-3 md:p-4 rounded-2xl bg-white dark:bg-card border border-border/60 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98] touch-manipulation"
    >
      <div className="flex items-center gap-3 md:gap-4">
        <div className={`p-2.5 rounded-xl ${config.bg} ${config.color} shrink-0`}>
          <StatusIcon size={20} strokeWidth={2.5} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-bold text-foreground truncate">{order.customer_name || 'Walk-in Client'}</p>
            <span className="hidden sm:inline-block text-[9px] font-mono text-muted-foreground uppercase bg-foreground/5 px-1.5 py-0.5 rounded flex-shrink-0">
              {order.order_ref}
            </span>
          </div>
          <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
            <Clock size={10} /> {time}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4 text-right shrink-0">
        <div>
          <p className="font-black text-sm md:text-base text-foreground tracking-tight">KES {Number(order.total_amount).toLocaleString()}</p>
          <p className={`text-[9px] md:text-[10px] font-bold uppercase tracking-wider mt-0.5 ${config.color}`}>
            {config.label}
          </p>
        </div>
        <ChevronRight size={16} className="text-muted-foreground group-hover:text-foreground transition-colors hidden sm:block" />
      </div>
    </motion.div>
  );
}

export function OrderPipeline({ userRole, orders }: { userRole: AppRole; orders: PipelineOrder[] }) {
  return (
    <div className="rounded-3xl border border-border bg-stone-50/50 dark:bg-card/40 p-5 md:p-6 backdrop-blur-sm h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-serif font-black tracking-tight text-foreground">Live Order Pipeline</h3>
          <p className="text-xs text-muted-foreground mt-1 font-medium">Real-time fulfillment queue.</p>
        </div>
        
        <AuthorizationScope allowedRoles={['super_admin', 'admin']} userRole={userRole}>
          <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-foreground text-background text-xs font-bold rounded-xl hover:opacity-90 transition-all active:scale-95 touch-manipulation shadow-md shrink-0">
            <Plus size={16} strokeWidth={2.5} /> Custom Wig Order
          </button>
        </AuthorizationScope>
      </div>

      <div className="space-y-2 md:space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
        {orders.length === 0 ? (
          <div className="h-32 flex items-center justify-center border-2 border-dashed border-border/60 rounded-2xl">
            <p className="text-xs font-bold text-muted-foreground">No orders processed today.</p>
          </div>
        ) : (
          orders.map(order => <OrderRow key={order.id} order={order} />)
        )}
      </div>
    </div>
  );
}