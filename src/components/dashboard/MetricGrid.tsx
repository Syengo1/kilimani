'use client';

import { motion, Variants } from 'framer-motion';
import { DollarSign, TrendingUp, ShoppingBag, Package, AlertTriangle } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { AuthorizationScope } from './AuthorizationScope';
import { AppRole } from '@/app/(admin)/dashboard/layout';

// ENTERPRISE DATA SCHEMA: Ready to accept live database metrics
export interface DashboardMetrics {
  revenueMTD: string;
  revenueChange: string;
  ordersProcessed: number;
  ordersChange: string;
  registerSales: string;
  transactions: number;
  totalStock: number;
  outOfStock: number;
  criticalAlerts: number;
}

interface MetricGridProps {
  userRole: AppRole;
  metrics?: DashboardMetrics; // Optional fallback for safe mounting
}

// ENTERPRISE FIX: Explicitly typed as Variants to satisfy strict TypeScript rules
const gridVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { staggerChildren: 0.1 } // Cascades the child cards 100ms apart
  }
};

export function MetricGrid({ userRole, metrics }: MetricGridProps) {
  // Graceful fallback data while the component mounts or if the network is loading
  const data = metrics || {
    revenueMTD: 'KES 0',
    revenueChange: '-- vs last month',
    ordersProcessed: 0,
    ordersChange: '--',
    registerSales: 'KES 0',
    transactions: 0,
    totalStock: 0,
    outOfStock: 0,
    criticalAlerts: 0,
  };

  return (
    <motion.div 
      variants={gridVariants}
      initial="hidden"
      animate="visible"
      className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {/* Super Admin & Admin View */}
      <AuthorizationScope allowedRoles={['super_admin', 'admin']} userRole={userRole}>
        <MetricCard 
          title="Gross Revenue (MTD)" 
          value={data.revenueMTD} 
          change={data.revenueChange} 
          icon={<DollarSign size={24} strokeWidth={2.5} />} 
        />
        <MetricCard 
          title="Orders Processed" 
          value={data.ordersProcessed} 
          change={data.ordersChange} 
          icon={<ShoppingBag size={24} strokeWidth={2.5} />} 
        />
      </AuthorizationScope>

      {/* Cashier Exclusive View */}
      <AuthorizationScope allowedRoles={['cashier']} userRole={userRole}>
        <MetricCard 
          title="Register Sales (Today)" 
          value={data.registerSales} 
          change="Active Shift" 
          icon={<TrendingUp size={24} strokeWidth={2.5} />} 
        />
        <MetricCard 
          title="Transactions" 
          value={data.transactions} 
          change="In-store Walk-ins" 
          icon={<ShoppingBag size={24} strokeWidth={2.5} />} 
        />
      </AuthorizationScope>

      {/* Universal Views (Everyone sees these) */}
      <MetricCard 
        title="Total Stock Units" 
        value={data.totalStock} 
        change={data.outOfStock > 0 ? `${data.outOfStock} variants depleted` : 'All items in stock'} 
        icon={<Package size={24} strokeWidth={2.5} />} 
      />
      
      <MetricCard 
        title="System Alerts" 
        value={`${data.criticalAlerts} Alerts`} 
        change={data.criticalAlerts > 0 ? 'Requires attention' : 'System healthy'} 
        icon={<AlertTriangle size={24} strokeWidth={2.5} />} 
        alert={data.criticalAlerts > 0}
      />
    </motion.div>
  );
}