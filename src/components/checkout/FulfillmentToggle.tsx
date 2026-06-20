'use client';

import React from 'react';
import { Truck, Store } from 'lucide-react';

interface FulfillmentToggleProps {
  value: 'pickup' | 'delivery';
  onChange: (value: 'pickup' | 'delivery') => void;
}

export default function FulfillmentToggle({ value, onChange }: FulfillmentToggleProps) {
  return (
    <div className="relative p-1 bg-foreground/5 dark:bg-foreground/5 border border-border/40 rounded-xl flex items-center w-full">
      {/* Sliding Background Element */}
      <div
        className={`absolute top-1 bottom-1 left-1 rounded-lg bg-background shadow-sm transition-all duration-300 ease-out z-0 ${
          value === 'delivery' ? 'w-[calc(50%-4px)] translate-x-0' : 'w-[calc(50%-4px)] translate-x-[100%]'
        }`}
      />

      <button
        type="button"
        onClick={() => onChange('delivery')}
        className={`flex-1 relative z-10 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors duration-200 ${
          value === 'delivery' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Truck size={16} />
        <span>Delivery</span>
      </button>

      <button
        type="button"
        onClick={() => onChange('pickup')}
        className={`flex-1 relative z-10 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors duration-200 ${
          value === 'pickup' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Store size={16} />
        <span>Store Pickup</span>
      </button>
    </div>
  );
}