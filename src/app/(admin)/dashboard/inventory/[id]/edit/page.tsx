import { getTaxonomy, getProductById } from '../../actions'
import ProductForm from '@/components/inventory/ProductForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Edit Product | Admin Dashboard",
}

export default async function EditProductPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  
  // Concurrently fetch the taxonomy and the specific product ID from the URL
  const [taxonomy, product] = await Promise.all([
    getTaxonomy(),
    getProductById(params.id)
  ])

  // If the product doesn't exist in the database, trigger Next.js 404 page
  if (!product) {
    notFound()
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col gap-4">
        <Link 
          href="/dashboard/inventory"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors w-fit"
        >
          <ArrowLeft size={16} /> Back to Inventory
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Edit Product</h1>
          <p className="text-sm text-foreground/60 mt-1.5 max-w-2xl leading-relaxed font-mono uppercase">
            ID: {product.id}
          </p>
        </div>
      </div>

      {/* 🚨 This triggers Edit Mode because initialData is provided */}
      <ProductForm taxonomy={taxonomy} initialData={product} />
    </div>
  )
}