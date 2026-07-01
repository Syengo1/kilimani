'use client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function RevenueChart({ data }: { data: { date: string; revenue: number }[] }) {
  if (data.length === 0) return <div className="h-64 flex items-center justify-center text-muted-foreground">No data for this period.</div>;

  return (
    <div className="h-72 w-full mt-4 text-xs font-mono">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#888888' }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888888' }} tickFormatter={(val) => `K ${val/1000}k`} />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any) => {
              // Safely convert whatever Recharts passes (number, string, or undefined) into a strict number
              const numericValue = Number(value) || 0;
              return [`KES ${numericValue.toLocaleString()}`, 'Revenue'];
            }}
          />
          <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}