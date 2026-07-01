import { getTaxonomy } from '../actions'
import ProductForm from '@/components/inventory/ProductForm'
import { ArrowLeft, Component } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

// --- METADATA FOR ADMIN SEO & BROWSER TABS ---
export const metadata: Metadata = {
  title: "Initialize Product Architecture | Admin Dashboard",
  description: "Define core product architecture and attach dynamic SKU variants.",
}

export default async function NewProductPage() {
  const taxonomy = await getTaxonomy()

  return (
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      <div className="flex flex-col gap-5">
        <Link 
          href="/dashboard/inventory"
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground bg-secondary/40 hover:bg-secondary/80 border border-border/50 px-3 py-1.5 rounded-lg transition-all w-fit shadow-sm active:scale-95"
        >
          <ArrowLeft size={16} /> Return to Master Inventory
        </Link>
        
        <div className="flex items-start gap-4">
          <div className="hidden sm:flex mt-1 w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 items-center justify-center text-primary shrink-0 shadow-inner">
            <Component size={24} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
              Initialize Product Architecture
            </h1>
            {/* FIX: Updated instructions to reflect the manual naming process */}
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
              Select a core classification (Hair, Accessory, or Consumable), assign a global display name, and dynamically configure the SKU matrix.
            </p>
          </div>
        </div>
      </div>

      <div className="relative mt-2 border-t border-border/50 pt-6">
        <ProductForm taxonomy={taxonomy} />
      </div>
      
    </div>
  )
}