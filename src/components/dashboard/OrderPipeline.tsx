'use client';

import { Plus, ChevronRight, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthorizationScope } from './AuthorizationScope';
import { AppRole } from '@/app/(admin)/dashboard/layout';

interface OrderRowProps {
  orderId: string;
  client: string;
  details: string;
  total: string;
  status: 'Processing' | 'Completed' | 'Pending Verification';
}

const statusConfig = {
  'Processing': { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
  'Completed': { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  'Pending Verification': { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
};

function OrderRow({ orderId, client, details, total, status }: OrderRowProps) {
  const StatusIcon = statusConfig[status].icon;

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="group flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-card border border-border/60 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98] touch-manipulation"
      onClick={() => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(30);
      }}
    >
      <div className="flex items-center gap-4">
        <div className={`p-2.5 rounded-xl ${statusConfig[status].bg} ${statusConfig[status].color}`}>
          <StatusIcon size={20} strokeWidth={2.5} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-bold text-foreground">{client}</p>
            <span className="text-[10px] font-mono text-muted-foreground uppercase bg-foreground/5 px-1.5 py-0.5 rounded-md">
              {orderId}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{details}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-right">
        <div className="hidden sm:block">
          <p className="font-black text-foreground tracking-tight">{total}</p>
          <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${statusConfig[status].color}`}>
            {status}
          </p>
        </div>
        <ChevronRight size={18} className="text-muted-foreground group-hover:text-foreground transition-colors" />
      </div>
    </motion.div>
  );
}

export function OrderPipeline({ userRole }: { userRole: AppRole }) {
  return (
    <div className="rounded-3xl border border-border bg-stone-50/50 dark:bg-card/40 p-6 backdrop-blur-sm">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-serif font-bold tracking-tight text-foreground">Live Order Pipeline</h3>
          <p className="text-xs text-muted-foreground mt-1">Real-time fulfillment queue.</p>
        </div>
        
        {/* Secure Action Button - Hidden from Cashiers */}
        <AuthorizationScope allowedRoles={['super_admin', 'admin']} userRole={userRole}>
          <button 
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-foreground text-background text-xs font-bold rounded-xl hover:opacity-90 transition-all active:scale-95 touch-manipulation shadow-md"
            onClick={() => {
              if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
            }}
          >
            <Plus size={16} strokeWidth={2.5} /> Custom Wig Order
          </button>
        </AuthorizationScope>
      </div>

      <div className="space-y-3">
        <OrderRow orderId="KIL-8B4K2" client="Amani N." details='24" Peruvian Straight Lace Front' total="KES 32,000" status="Processing" />
        <OrderRow orderId="KIL-9P1M5" client="Zawadi M." details='18" HD Closure Bob Wig' total="KES 24,500" status="Completed" />
        <OrderRow orderId="KIL-2X7C9" client="Mwende K." details="Custom Colored Deep Wave" total="KES 41,000" status="Pending Verification" />
      </div>

    </div>
  );
}