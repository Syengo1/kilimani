'use client';

import { ReactNode } from 'react';
import { motion, Variants } from 'framer-motion';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: ReactNode;
  alert?: boolean;
}

export const metricCardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { type: 'spring', stiffness: 300, damping: 24 } 
  }
};

export function MetricCard({ title, value, change, icon, alert }: MetricCardProps) {
  return (
    <motion.div 
      variants={metricCardVariants}
      className="group relative overflow-hidden rounded-3xl border border-border bg-white dark:bg-card p-4 md:p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
    >
      {/* Decorative premium glow flare on hover */}
      <div className="absolute -inset-px bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 rounded-3xl pointer-events-none" />
      
      <div className="relative flex items-start justify-between gap-3">
        <div className="space-y-1 flex-1 min-w-0">
          {/* FIX: Replaced 'truncate' with 'line-clamp-2' so long titles wrap gracefully */}
          <p className="text-[10px] md:text-[11px] font-bold text-muted-foreground tracking-widest uppercase line-clamp-2 leading-tight">
            {title}
          </p>
          {/* FIX: Scaled text down slightly to prevent "KES 1,000,000" from overflowing mobile boxes */}
          <p className="text-xl md:text-2xl font-black tracking-tight text-foreground leading-none truncate mt-1">
            {value}
          </p>
          {change && (
            <p className={`text-[10px] md:text-xs mt-1.5 truncate font-bold ${alert ? 'text-amber-600 dark:text-amber-500' : 'text-emerald-600 dark:text-emerald-500'}`}>
              {change}
            </p>
          )}
        </div>
        
        <div className={`shrink-0 p-2.5 md:p-3 rounded-2xl transition-all duration-300 ${
          alert 
            ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-500' 
            : 'bg-primary/10 text-primary group-hover:bg-primary/20 group-hover:scale-110'
        }`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}