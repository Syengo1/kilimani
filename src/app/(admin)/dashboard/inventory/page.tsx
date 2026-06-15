import { getInventoryData, getTaxonomy } from './actions'
import { InventoryClient } from '@/components/inventory/InventoryClient'
import { PackageSearch, Plus } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Inventory Management | Admin Dashboard",
  description: "Manage your master product catalog and SKU variants.",
}

export default async function InventoryPage() {
  // Fetch data concurrently for maximum speed
  const [inventory, taxonomy] = await Promise.all([
    getInventoryData(),
    getTaxonomy()
  ])

  // Single-pass metric calculation
  const totalProducts = inventory.length
  let totalVariants = 0
  let lowStockCount = 0

  inventory.forEach((prod) => {
    const variants = prod.variants || []
    totalVariants += variants.length
    
    // Safely type-check and count low stock items
    lowStockCount += variants.filter((v: { stock_quantity: number }) => v.stock_quantity < 5).length
  })

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col pb-24 md:pb-10">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Stock Management</h1>
          <p className="text-sm text-foreground/60 mt-1.5 leading-relaxed max-w-xl">
            Manage your master product catalog, monitor SKU variants, and adjust pricing.
          </p>
        </div>
        
        {/* METRICS & ACTION ROW */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 text-sm w-full xl:w-auto">
          
          {/* Mobile-Optimized Metrics Card */}
          <div className="grid grid-cols-3 divide-x divide-border border border-border bg-card rounded-xl shadow-sm w-full md:w-auto overflow-hidden">
            <div className="flex flex-col items-center justify-center p-3 sm:px-5 sm:py-3 bg-background/50">
              <span className="text-muted-foreground text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-center">Products</span>
              <span className="font-black text-lg sm:text-xl leading-none mt-1">{totalProducts}</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 sm:px-5 sm:py-3 bg-background/50">
              <span className="text-muted-foreground text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-center">SKUs</span>
              <span className="font-black text-lg sm:text-xl leading-none mt-1">{totalVariants}</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 sm:px-5 sm:py-3 bg-background/50">
              <span className="text-muted-foreground text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-center">Low Stock</span>
              <span className={`font-black text-lg sm:text-xl leading-none mt-1 ${lowStockCount > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                {lowStockCount}
              </span>
            </div>
          </div>

          <Link 
            href="/dashboard/inventory/new"
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-4 md:py-3.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20"
          >
            <Plus size={18} /> Add New Product
          </Link>
        </div>
      </div>

      {/* INTERACTIVE CLIENT WORKSPACE */}
      <div className="flex-1 bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col relative min-h-[500px]">
        {inventory.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-background/50 h-full">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 text-primary">
              <PackageSearch size={40} />
            </div>
            <h3 className="text-xl font-black tracking-tight">Catalog is Empty</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-2 mb-8 leading-relaxed">
              Your database schema is active, but no products exist yet. Initialize your first premium product to begin tracking inventory.
            </p>
            <Link 
              href="/dashboard/inventory/new"
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20"
            >
              <Plus size={18} /> Initialize First Product
            </Link>
          </div>
        ) : (
          <InventoryClient initialData={inventory} taxonomy={taxonomy} />
        )}
      </div>
    </div>
  )
}