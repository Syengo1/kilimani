'use client';
import { AnalyticsPayload } from '@/app/actions/analytics';
import { Lightbulb, CheckCircle2, Info, AlertOctagon } from 'lucide-react';
import { motion } from 'framer-motion';

export function SmartInsights({ insights }: { insights: AnalyticsPayload['insights'] }) {
  if (insights.length === 0) return null;

  const getIcon = (type: string) => {
    if (type === 'success') return <CheckCircle2 className="text-emerald-500 shrink-0" size={18} />;
    if (type === 'warning') return <AlertOctagon className="text-destructive shrink-0" size={18} />;
    return <Info className="text-blue-500 shrink-0" size={18} />;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-background border border-border/50 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2 border-b border-border/50 pb-3">
        <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg"><Lightbulb size={18} strokeWidth={2.5} /></div>
        <div>
          <h3 className="font-bold text-foreground">Kilimani AI Insights</h3>
          <p className="text-xs text-muted-foreground">Automated business recommendations</p>
        </div>
      </div>
      <div className="space-y-3">
        {insights.map((insight, i) => (
          <div key={i} className="flex gap-3 p-3 rounded-xl bg-foreground/[0.02] border border-border/40 items-start">
            {getIcon(insight.type)}
            <p className="text-sm font-medium text-foreground leading-snug">{insight.message}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}