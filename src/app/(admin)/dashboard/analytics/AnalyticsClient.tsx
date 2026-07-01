'use client';

import { useState } from 'react';
import { AnalyticsPayload, fetchAnalyticsData } from '@/app/actions/analytics';
import { OverviewCards } from '@/components/analytics/OverviewCards';
import { SmartInsights } from '@/components/analytics/SmartInsights';
import { RevenueChart } from '@/components/analytics/RevenueChart';
import { TopProducts } from '@/components/analytics/TopProducts';
import { Loader2, TrendingUp, Users } from 'lucide-react';
// FIX 1: Imported motion from framer-motion
import { motion } from 'framer-motion';

export function AnalyticsClient({ initialData }: { initialData: AnalyticsPayload }) {
  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<AnalyticsPayload>(initialData);
  const [isLoading, setIsLoading] = useState(false);

  // FIX 2: Replaced useEffect with a direct Event Handler. 
  // This is the modern React standard. It prevents cascading renders and satisfies the linter.
  const handleDaysChange = async (newDays: number) => {
    if (newDays === days) return; // Prevent unnecessary fetches
    
    setDays(newDays);
    setIsLoading(true);
    
    try {
      const newData = await fetchAnalyticsData(newDays);
      setData(newData);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-20">
      
      {/* Date Range Selector */}
        <div className="flex justify-end w-full">
        <div className="max-w-full overflow-x-auto no-scrollbar pb-1 -mb-1">
            <div className="bg-background border border-border/50 rounded-xl p-1 inline-flex shadow-sm min-w-max">
            {[
                { label: 'Today', value: 1 },
                { label: 'Yesterday', value: 2 },
                { label: '7 Days', value: 7 },
                { label: '30 Days', value: 30 },
                { label: '90 Days', value: 90 }
            ].map(({ label, value }) => (
                <button
                key={value} 
                onClick={() => handleDaysChange(value)} 
                disabled={isLoading}
                className={`px-3 md:px-4 py-1.5 rounded-lg text-[11px] md:text-xs font-bold transition-all whitespace-nowrap touch-manipulation active:scale-95 ${
                    days === value 
                    ? 'bg-foreground text-background shadow-md' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                }`}
                >
                {label}
                </button>
            ))}
            </div>
        </div>
        </div>

      {isLoading ? (
        <div className="h-64 flex flex-col items-center justify-center text-muted-foreground gap-3">
          <Loader2 className="animate-spin" size={32} />
          <p className="text-sm font-semibold">Crunching the numbers...</p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          
          {/* Top KPIs */}
          <OverviewCards data={data} />
          
          {/* Middle Row: Chart & Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-background border border-border/50 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={18} className="text-primary" />
                <h3 className="font-bold text-foreground">Revenue Trend</h3>
              </div>
              <RevenueChart data={data.chartData} />
            </div>
            <div>
              <SmartInsights insights={data.insights} />
            </div>
          </div>

          {/* Bottom Row: Leaderboards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopProducts products={data.topProducts} />
            
            {/* Staff Leaderboard */}
            <div className="bg-background border border-border/50 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
              <div className="p-4 border-b border-border/50 flex items-center gap-2 bg-foreground/[0.02]">
                <Users size={16} className="text-muted-foreground" />
                <h3 className="font-bold text-sm">Staff Performance</h3>
              </div>
              <div className="p-2 space-y-1 overflow-y-auto custom-scrollbar flex-1">
                {data.staff.length === 0 ? (
                  <p className="p-4 text-center text-xs text-muted-foreground">No POS sales recorded.</p>
                ) : (
                  data.staff.map((staff, i) => (
                    <div key={staff.id} className="flex justify-between items-center p-3 hover:bg-foreground/5 rounded-xl transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black">{i + 1}</div>
                        <div>
                          <p className="font-bold text-sm">{staff.name}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{staff.orderCount} Orders Processed</p>
                        </div>
                      </div>
                      <span className="font-black text-sm text-emerald-600">KES {staff.revenue.toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}