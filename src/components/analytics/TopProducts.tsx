'use client';
import { Package } from 'lucide-react';

export function TopProducts({ products }: { products: { name: string; quantity: number; revenue: number }[] }) {
  return (
    <div className="bg-background border border-border/50 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-border/50 flex items-center gap-2 bg-foreground/[0.02]">
        <Package size={16} className="text-muted-foreground" />
        <h3 className="font-bold text-sm">Top Selling Products</h3>
      </div>
      <div className="p-2 space-y-1 overflow-y-auto custom-scrollbar flex-1">
        {products.length === 0 ? (
          <p className="p-4 text-center text-xs text-muted-foreground">No sales recorded.</p>
        ) : (
          products.map((p, i) => (
            <div key={i} className="flex justify-between items-center p-3 hover:bg-foreground/5 rounded-xl transition-colors">
              <div>
                <p className="font-bold text-sm line-clamp-1">{p.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{p.quantity} Units Sold</p>
              </div>
              <span className="font-black text-sm text-foreground">KES {p.revenue.toLocaleString()}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}