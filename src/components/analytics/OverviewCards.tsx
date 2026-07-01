'use client';
import { AnalyticsPayload } from '@/app/actions/analytics';
import { Banknote, MonitorSmartphone, Globe, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';

export function OverviewCards({ data }: { data: AnalyticsPayload }) {
  const cards = [
    { title: 'Total Revenue', value: `KES ${data.financials.total.toLocaleString()}`, icon: Banknote, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
    { title: 'POS Sales', value: `KES ${data.financials.pos.toLocaleString()}`, icon: MonitorSmartphone, color: 'text-indigo-600', bg: 'bg-indigo-500/10' },
    { title: 'Web Sales', value: `KES ${data.financials.web.toLocaleString()}`, icon: Globe, color: 'text-purple-600', bg: 'bg-purple-500/10' },
    // FIX: Replaced the removed inventory stats with the new Average Order Value (AOV)
    { title: 'Avg Order Value', value: `KES ${Math.round(data.financials.aov).toLocaleString()}`, subtitle: 'Overall AOV', icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-500/10' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
          key={card.title} className="bg-background border border-border/50 p-5 rounded-2xl shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{card.title}</p>
              <h3 className="text-2xl font-black text-foreground mt-1">{card.value}</h3>
              {card.subtitle && <p className="text-xs font-semibold text-muted-foreground mt-1">{card.subtitle}</p>}
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.bg} ${card.color}`}>
              <card.icon size={20} strokeWidth={2.5} />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}