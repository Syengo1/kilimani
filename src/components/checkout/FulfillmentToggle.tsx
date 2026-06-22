'use client';

import React from 'react';
import { Truck, Store } from 'lucide-react';

interface FulfillmentToggleProps {
  value: 'pickup' | 'delivery';
  onChange: (value: 'pickup' | 'delivery') => void;
}

export default function FulfillmentToggle({ value, onChange }: FulfillmentToggleProps) {
  return (
    <div className="relative p-1.5 bg-foreground/[0.03] border border-border/50 rounded-2xl flex items-center w-full shadow-inner">
      {/* Sliding Background Element (Native iOS feel) */}
      <div
        className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-xl bg-background shadow-md border border-border/40 transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1) z-0 ${
          value === 'delivery' ? 'translate-x-0' : 'translate-x-[calc(100%+0px)]'
        }`}
      />

      <button
        type="button"
        onClick={() => onChange('delivery')}
        className={`flex-1 relative z-10 py-3.5 flex items-center justify-center gap-2.5 text-sm font-semibold transition-colors duration-300 ${
          value === 'delivery' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/80'
        }`}
      >
        <Truck size={18} strokeWidth={value === 'delivery' ? 2.5 : 2} />
        <span>Delivery</span>
      </button>

      <button
        type="button"
        onClick={() => onChange('pickup')}
        className={`flex-1 relative z-10 py-3.5 flex items-center justify-center gap-2.5 text-sm font-semibold transition-colors duration-300 ${
          value === 'pickup' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/80'
        }`}
      >
        <Store size={18} strokeWidth={value === 'pickup' ? 2.5 : 2} />
        <span>Store Pickup</span>
      </button>
    </div>
  );
}