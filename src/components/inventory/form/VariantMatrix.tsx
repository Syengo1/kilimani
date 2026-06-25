'use client';

import { Layers, Plus, Trash2 } from 'lucide-react';
import { ProductType } from './TaxonomySection';

export interface VariantState {
  id: string | number;
  sku: string;
  stock: number;
  cost: number;
  price: number;
  discountPrice: number | '';
  attributes: Record<string, string>;
}

interface VariantMatrixProps {
  productType: ProductType;
  variants: VariantState[];
  setVariants: React.Dispatch<React.SetStateAction<VariantState[]>>;
  setDeletedVariantIds: React.Dispatch<React.SetStateAction<string[]>>;
  isWorking: boolean;
}

export default function VariantMatrix({ productType, variants, setVariants, setDeletedVariantIds, isWorking }: VariantMatrixProps) {
  
  const addVariantRow = () => {
    setVariants([...variants, { id: Date.now(), sku: '', attributes: {}, stock: 0, cost: 0, price: 0, discountPrice: '' }]);
  };

  const updateVariant = <K extends keyof Omit<VariantState, 'attributes'>>(id: string | number, field: K, value: VariantState[K]) => {
    setVariants(variants.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const updateVariantAttribute = (id: string | number, attrKey: string, value: string) => {
    setVariants(variants.map(v => v.id === id ? { ...v, attributes: { ...v.attributes, [attrKey]: value } } : v));
  };

  const removeVariant = (idToRemove: string | number) => {
    if (variants.length > 1) {
      if (typeof idToRemove === 'string') setDeletedVariantIds(prev => [...prev, idToRemove]);
      setVariants(variants.filter(v => v.id !== idToRemove));
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
      <div className="relative z-20 p-5 border-b border-border bg-background/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary"><Layers size={18} /></div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest">3. SKU Variant Matrix</h2>
            <p className="text-xs text-foreground/50 mt-0.5 capitalize">Formatting for: {productType}</p>
          </div>
        </div>
        <button type="button" onClick={addVariantRow} disabled={isWorking} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-card border-2 border-border rounded-xl text-xs font-bold hover:bg-secondary active:scale-95 transition-all shadow-sm">
          <Plus size={16} /> Add SKU Row
        </button>
      </div>

      <div className="p-4 md:p-6 space-y-4">
        {variants.map((v, index) => (
          <div key={v.id} className="grid grid-cols-2 lg:flex lg:flex-row gap-4 p-4 pt-12 lg:pt-4 rounded-xl border border-border/60 bg-background/40 hover:border-primary/30 transition-colors relative group">
            
            <div className="col-span-2 lg:w-48 space-y-1.5">
              <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider">Unique SKU</label>
              <input type="text" disabled={isWorking} placeholder={`SKU-00${index + 1}`} value={v.sku} onChange={(e) => updateVariant(v.id, 'sku', e.target.value)} className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm uppercase font-mono shadow-sm" />
            </div>
            
            {/* Dynamic Attributes based on ProductType */}
            {productType === 'hair' && (
              <>
                <div className="lg:w-28 space-y-1.5">
                  <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider">Length</label>
                  <input type="text" disabled={isWorking} placeholder='14"' value={v.attributes.length || ''} onChange={(e) => updateVariantAttribute(v.id, 'length', e.target.value)} className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm shadow-sm" />
                </div>
                <div className="lg:w-28 space-y-1.5">
                  <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider">Color</label>
                  <input type="text" disabled={isWorking} placeholder='1B' value={v.attributes.color || ''} onChange={(e) => updateVariantAttribute(v.id, 'color', e.target.value)} className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm shadow-sm" />
                </div>
              </>
            )}

            {productType === 'accessory' && (
              <>
                <div className="lg:w-28 space-y-1.5">
                  <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider">Variant/Style</label>
                  <input type="text" disabled={isWorking} placeholder='Ceramic' value={v.attributes.style || ''} onChange={(e) => updateVariantAttribute(v.id, 'style', e.target.value)} className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm shadow-sm" />
                </div>
                <div className="lg:w-28 space-y-1.5">
                  <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider">Color</label>
                  <input type="text" disabled={isWorking} placeholder='Pink' value={v.attributes.color || ''} onChange={(e) => updateVariantAttribute(v.id, 'color', e.target.value)} className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm shadow-sm" />
                </div>
              </>
            )}

            {productType === 'haircare' && (
              <div className="lg:w-32 space-y-1.5">
                <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider">Size/Volume</label>
                <input type="text" disabled={isWorking} placeholder='150ml' value={v.attributes.volume || ''} onChange={(e) => updateVariantAttribute(v.id, 'volume', e.target.value)} className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm shadow-sm" />
              </div>
            )}

            {/* Core Financials */}
            <div className="lg:w-24 space-y-1.5">
              <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider">Stock</label>
              <input type="number" disabled={isWorking} value={v.stock} onChange={(e) => updateVariant(v.id, 'stock', parseInt(e.target.value) || 0)} className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm font-mono shadow-sm" />
            </div>

            <div className="lg:w-28 space-y-1.5">
              <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider">Cost</label>
              <input type="number" disabled={isWorking} value={v.cost} onChange={(e) => updateVariant(v.id, 'cost', parseInt(e.target.value) || 0)} className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm font-mono shadow-sm" />
            </div>

            <div className="lg:w-32 space-y-1.5">
              <label className="text-[10px] font-bold text-primary uppercase tracking-wider">Sell Price</label>
              <input type="number" disabled={isWorking} value={v.price} onChange={(e) => updateVariant(v.id, 'price', parseInt(e.target.value) || 0)} className="w-full bg-primary/5 border border-primary/20 rounded-lg px-3 py-2.5 text-sm font-bold text-primary font-mono shadow-sm" />
            </div>

            <div className="lg:w-32 space-y-1.5">
              <label className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Discount</label>
              <input type="number" disabled={isWorking} placeholder="Optional" value={v.discountPrice} onChange={(e) => updateVariant(v.id, 'discountPrice', e.target.value ? parseInt(e.target.value) : '')} className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm font-mono shadow-sm text-emerald-500" />
            </div>

            {!isWorking && (
              <button type="button" onClick={() => removeVariant(v.id)} disabled={variants.length === 1} className="absolute right-3 top-3 p-2 bg-background/80 border border-border/50 rounded-lg text-muted-foreground hover:text-red-500 hover:border-red-200 disabled:opacity-0 shadow-sm z-10"><Trash2 size={16} /></button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}