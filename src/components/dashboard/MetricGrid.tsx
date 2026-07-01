'use client';

import { motion, Variants } from 'framer-motion';
import { DollarSign, TrendingUp, ShoppingBag, Package, AlertTriangle } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { AuthorizationScope } from './AuthorizationScope';
import { AppRole } from '@/app/(admin)/dashboard/layout';

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
  metrics: DashboardMetrics; 
}

const gridVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { staggerChildren: 0.1 } 
  }
};

export function MetricGrid({ userRole, metrics }: MetricGridProps) {
  return (
    <motion.div 
      variants={gridVariants}
      initial="hidden"
      animate="visible"
      // FIX: Optimized grid gaps and breakpoints for perfect mobile and iPad rendering
      className="grid gap-3 sm:gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
    >
      {/* Super Admin & Admin View */}
      <AuthorizationScope allowedRoles={['super_admin', 'admin']} userRole={userRole}>
        <MetricCard 
          title="Gross Revenue (MTD)" 
          value={metrics.revenueMTD} 
          change={metrics.revenueChange} 
          icon={<DollarSign size={20} strokeWidth={2.5} />} 
        />
        <MetricCard 
          title="Orders Processed" 
          value={metrics.ordersProcessed} 
          change={metrics.ordersChange} 
          icon={<ShoppingBag size={20} strokeWidth={2.5} />} 
        />
      </AuthorizationScope>

      {/* Cashier Exclusive View */}
      <AuthorizationScope allowedRoles={['cashier']} userRole={userRole}>
        <MetricCard 
          title="Register Sales (Today)" 
          value={metrics.registerSales} 
          change="Active Shift" 
          icon={<TrendingUp size={20} strokeWidth={2.5} />} 
        />
        <MetricCard 
          title="Transactions" 
          value={metrics.transactions} 
          change="In-store Walk-ins" 
          icon={<ShoppingBag size={20} strokeWidth={2.5} />} 
        />
      </AuthorizationScope>

      {/* Universal Views (Everyone sees these) */}
      <MetricCard 
        title="Total Stock Units" 
        value={metrics.totalStock.toLocaleString()} 
        change={metrics.outOfStock > 0 ? `${metrics.outOfStock} variants depleted` : 'All items in stock'} 
        icon={<Package size={20} strokeWidth={2.5} />} 
      />
      
      <MetricCard 
        title="System Alerts" 
        value={`${metrics.criticalAlerts} Alerts`} 
        change={metrics.criticalAlerts > 0 ? 'Requires attention' : 'System healthy'} 
        icon={<AlertTriangle size={20} strokeWidth={2.5} />} 
        alert={metrics.criticalAlerts > 0}
      />
    </motion.div>
  );
}