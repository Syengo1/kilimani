'use client';

import { useState } from 'react';
import { Scissors, Sparkles, SprayCan, PlusCircle, Loader2, Check, X } from 'lucide-react';
import { createNewCategory, createNewCollection } from '@/app/(admin)/dashboard/inventory/actions';

export type ProductType = 'hair' | 'accessory' | 'haircare';

interface TaxonomySectionProps {
  productType: ProductType;
  setProductType: (t: ProductType) => void;
  description: string;
  setDescription: (d: string) => void;
  categoryId: string;
  setCategoryId: (id: string) => void;
  collectionId: string;
  setCollectionId: (id: string) => void;
  initialCategories: { id: string; name: string }[];
  initialCollections: { id: string; name: string }[];
  isWorking: boolean;
}

export default function TaxonomySection({
  productType, setProductType,
  description, setDescription,
  categoryId, setCategoryId,
  collectionId, setCollectionId,
  initialCategories, initialCollections,
  isWorking
}: TaxonomySectionProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [collections, setCollections] = useState(initialCollections);

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  const [isAddingCollection, setIsAddingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isSavingCollection, setIsSavingCollection] = useState(false);

  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) return setIsAddingCategory(false);
    setIsSavingCategory(true);
    const res = await createNewCategory(newCategoryName);
    if (res.success && res.data) {
      setCategories(prev => [...prev, res.data]);
      setCategoryId(res.data.id);
      setNewCategoryName('');
      setIsAddingCategory(false);
    }
    setIsSavingCategory(false);
  };

  const handleSaveCollection = async () => {
    if (!newCollectionName.trim()) return setIsAddingCollection(false);
    setIsSavingCollection(true);
    const res = await createNewCollection(newCollectionName);
    if (res.success && res.data) {
      setCollections(prev => [...prev, res.data]);
      setCollectionId(res.data.id);
      setNewCollectionName('');
      setIsAddingCollection(false);
    }
    setIsSavingCollection(false);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-8">
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
          1. Core Product Architecture
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button type="button" onClick={() => setProductType('hair')} className={`p-4 flex flex-col items-center justify-center gap-2 rounded-xl border-2 transition-all ${productType === 'hair' ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background text-muted-foreground hover:border-primary/50'}`}>
            <Scissors size={24} />
            <span className="font-bold text-sm">Hair Unit</span>
            <span className="text-[10px] text-center opacity-70">Wigs, Bundles, Frontals</span>
          </button>
          <button type="button" onClick={() => setProductType('accessory')} className={`p-4 flex flex-col items-center justify-center gap-2 rounded-xl border-2 transition-all ${productType === 'accessory' ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background text-muted-foreground hover:border-primary/50'}`}>
            <Sparkles size={24} />
            <span className="font-bold text-sm">Accessory</span>
            <span className="text-[10px] text-center opacity-70">Hot Combs, Lashes, Brushes</span>
          </button>
          <button type="button" onClick={() => setProductType('haircare')} className={`p-4 flex flex-col items-center justify-center gap-2 rounded-xl border-2 transition-all ${productType === 'haircare' ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background text-muted-foreground hover:border-primary/50'}`}>
            <SprayCan size={24} />
            <span className="font-bold text-sm">Consumable</span>
            <span className="text-[10px] text-center opacity-70">Wax, Spray, Fragrance</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/50">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-foreground/60 uppercase tracking-widest flex justify-between items-center">
            <span>Category Taxonomy</span>
            {!isAddingCategory && !isWorking && (
              <button type="button" onClick={() => setIsAddingCategory(true)} className="text-primary flex items-center gap-1 hover:underline">
                <PlusCircle size={12} /> Add New
              </button>
            )}
          </label>
          {isAddingCategory ? (
            <div className="flex items-center gap-2">
              <input autoFocus type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSaveCategory())} placeholder="New Category..." className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50" />
              <button type="button" onClick={handleSaveCategory} disabled={isSavingCategory} className="p-2.5 bg-primary text-primary-foreground rounded-xl shadow-sm">{isSavingCategory ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}</button>
              <button type="button" onClick={() => setIsAddingCategory(false)} className="p-2.5 bg-secondary text-muted-foreground rounded-xl"><X size={16} /></button>
            </div>
          ) : (
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} disabled={isWorking} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 appearance-none font-medium">
              <option value="">Select a Category...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-foreground/60 uppercase tracking-widest flex justify-between items-center">
            <span>Collection / Style</span>
            {!isAddingCollection && !isWorking && (
              <button type="button" onClick={() => setIsAddingCollection(true)} className="text-primary flex items-center gap-1 hover:underline">
                <PlusCircle size={12} /> Add New
              </button>
            )}
          </label>
          {isAddingCollection ? (
            <div className="flex items-center gap-2">
              <input autoFocus type="text" value={newCollectionName} onChange={(e) => setNewCollectionName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSaveCollection())} placeholder="New Collection..." className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50" />
              <button type="button" onClick={handleSaveCollection} disabled={isSavingCollection} className="p-2.5 bg-primary text-primary-foreground rounded-xl shadow-sm">{isSavingCollection ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}</button>
              <button type="button" onClick={() => setIsAddingCollection(false)} className="p-2.5 bg-secondary text-muted-foreground rounded-xl"><X size={16} /></button>
            </div>
          ) : (
            <select value={collectionId} onChange={(e) => setCollectionId(e.target.value)} disabled={isWorking} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 appearance-none font-medium">
              <option value="">None (Standalone Product)</option>
              {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* NEW: PRODUCT DESCRIPTION FIELD */}
      <div className="pt-4 border-t border-border/50 space-y-2">
        <label className="text-[10px] font-bold text-foreground/60 uppercase tracking-widest flex justify-between items-center">
          <span>Global Product Description</span>
          <span className="text-muted-foreground/50 font-mono font-normal">Applies to all SKUs</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isWorking}
          placeholder="Describe the product material, benefits, origin, and styling recommendations..."
          className="w-full h-32 bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors shadow-sm disabled:opacity-50 resize-none custom-scrollbar"
        />
      </div>
      
    </div>
  );
}