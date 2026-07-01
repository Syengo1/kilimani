import { getInventoryData, getTaxonomy } from './actions'
import { InventoryClient } from '@/components/inventory/InventoryClient'
import { PackageSearch, Plus, Scissors, Sparkles, SprayCan } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Inventory Management | Admin Dashboard",
  description: "Manage your master product catalog and SKU variants.",
}

// Ensure the inventory dashboard never serves stale cached data
export const dynamic = 'force-dynamic';

// 1. Define strict Types matching our newly upgraded Schema
type ProductType = 'hair' | 'accessory' | 'haircare';
type TaxonomyRecord = { name: string };

// 2. Strictly type the raw Supabase payload
interface RawInventoryItem {
  id: string;
  name?: string; // FIX: Added the database 'name' column
  product_type: ProductType; 
  created_at?: string;
  category?: TaxonomyRecord | TaxonomyRecord[] | null;
  collection?: TaxonomyRecord | TaxonomyRecord[] | null;
  product_images?: { url: string; display_order: number }[];
  variants?: { id: string; stock_quantity: number; price_kes: number; sku: string; discount_price_kes?: number | null }[];
}

// 3. NEW: Strictly type the formatted output to eliminate implicit 'any' errors
interface FormattedInventoryItem {
  id: string;
  name: string; // FIX: Added the required 'name' property for the Client
  product_type: ProductType;
  category: TaxonomyRecord | null;
  collection: TaxonomyRecord | null;
  product_images: { url: string; display_order: number }[];
  variants: { id: string; stock_quantity: number; price_kes: number; sku: string; discount_price_kes?: number | null }[];
}

export default async function InventoryPage() {
  // Fetch data concurrently for maximum speed
  const [inventoryRaw, taxonomy] = await Promise.all([
    getInventoryData(),
    getTaxonomy()
  ])

  // 4. Map the data and bind it to the FormattedInventoryItem array
  const formattedInventory: FormattedInventoryItem[] = (inventoryRaw as unknown as RawInventoryItem[] || []).map((item) => ({
    id: item.id,
    name: item.name || 'Unnamed Product', // FIX: Map the name to the Client payload
    product_type: item.product_type || 'hair', 
    category: (Array.isArray(item.category) ? item.category[0] : item.category) ?? null,
    collection: (Array.isArray(item.collection) ? item.collection[0] : item.collection) ?? null,
    variants: item.variants ?? [],
    product_images: item.product_images ?? [],
  }))

  // 5. TypeScript now knows exactly what 'prod' and 'v' are!
  const totalProducts = formattedInventory.length
  let totalVariants = 0
  let lowStockCount = 0

  formattedInventory.forEach((prod) => {
    const variants = prod.variants
    totalVariants += variants.length
    lowStockCount += variants.filter((v) => v.stock_quantity < 5).length
  })

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col pb-24 md:pb-10">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Stock Management</h1>
          <p className="text-sm text-foreground/60 mt-1.5 leading-relaxed max-w-xl">
            Manage your master product catalog, monitor SKU variants, and adjust architectural configurations.
          </p>
        </div>
        
        {/* METRICS & ACTION ROW */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 text-sm w-full xl:w-auto">
          
          {/* Mobile-Optimized Metrics Card */}
          <div className="grid grid-cols-3 divide-x divide-border border border-border bg-card rounded-xl shadow-sm w-full md:w-auto overflow-hidden">
            <div className="flex flex-col items-center justify-center p-3 sm:px-5 sm:py-3 bg-background/50 hover:bg-secondary/30 transition-colors">
              <span className="text-muted-foreground text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-center">Products</span>
              <span className="font-black text-lg sm:text-xl leading-none mt-1 text-foreground">{totalProducts}</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 sm:px-5 sm:py-3 bg-background/50 hover:bg-secondary/30 transition-colors">
              <span className="text-muted-foreground text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-center">SKUs</span>
              <span className="font-black text-lg sm:text-xl leading-none mt-1 text-foreground">{totalVariants}</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 sm:px-5 sm:py-3 bg-background/50 hover:bg-secondary/30 transition-colors">
              <span className="text-muted-foreground text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-center">Low Stock</span>
              <span className={`font-black text-lg sm:text-xl leading-none mt-1 ${lowStockCount > 0 ? 'text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]' : 'text-emerald-500'}`}>
                {lowStockCount}
              </span>
            </div>
          </div>

          <Link 
            href="/dashboard/inventory/new"
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-4 md:py-3.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20"
          >
            <Plus size={18} strokeWidth={2.5} /> Add New Product
          </Link>
        </div>
      </div>

      {/* INTERACTIVE CLIENT WORKSPACE */}
      <div className="flex-1 bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col relative min-h-[500px]">
        {formattedInventory.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-background/50 h-full">
            <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 text-primary shadow-inner">
              <PackageSearch size={40} strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-black tracking-tight text-foreground">Catalog Architecture Empty</h3>
            <p className="text-sm text-muted-foreground max-w-md mt-3 mb-8 leading-relaxed">
              Your database schema is active, but no products exist yet. Initialize your first dynamic unit to generate SKUs and begin tracking inventory.
            </p>
            
            {/* Visual Hints for the new Architecture */}
            <div className="flex items-center justify-center gap-4 mb-8 opacity-70">
              <div className="flex flex-col items-center gap-2"><Scissors size={18}/><span className="text-[10px] uppercase font-bold">Hair</span></div>
              <div className="w-1 h-1 rounded-full bg-border" />
              <div className="flex flex-col items-center gap-2"><Sparkles size={18}/><span className="text-[10px] uppercase font-bold">Accessory</span></div>
              <div className="w-1 h-1 rounded-full bg-border" />
              <div className="flex flex-col items-center gap-2"><SprayCan size={18}/><span className="text-[10px] uppercase font-bold">Consumable</span></div>
            </div>

            <Link 
              href="/dashboard/inventory/new"
              className="flex items-center justify-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20"
            >
              <Plus size={18} strokeWidth={2.5} /> Initialize First Product
            </Link>
          </div>
        ) : (
          <InventoryClient initialData={formattedInventory} taxonomy={taxonomy} />
        )}
      </div>
    </div>
  )
}