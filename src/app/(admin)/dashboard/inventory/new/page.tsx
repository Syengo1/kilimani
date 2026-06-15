import { getTaxonomy } from '../actions'
// 🚨 TYPESCRIPT FIX: Imported without curly braces because it is now a default export
import CreateProductForm from '@/components/inventory/ProductForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

// --- METADATA FOR ADMIN SEO & BROWSER TABS ---
export const metadata: Metadata = {
  title: "Initialize New Product | Admin Dashboard",
  description: "Create a base product shell and attach SKU variants to the master inventory.",
}

export default async function NewProductPage() {
  // Fetch taxonomy data (Categories & Collections) server-side
  const taxonomy = await getTaxonomy()

  return (
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <Link 
          href="/dashboard/inventory"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors w-fit"
        >
          <ArrowLeft size={16} /> Back to Inventory
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Initialize New Product</h1>
          <p className="text-sm text-foreground/60 mt-1.5 max-w-2xl leading-relaxed">
            Create a base product shell and attach specific SKU variants. Ensure all pricing and variant matrix fields are accurately filled before committing to the database.
          </p>
        </div>
      </div>

      {/* Client Interactive Form */}
      <div className="relative">
        <CreateProductForm taxonomy={taxonomy} />
      </div>
    </div>
  )
}