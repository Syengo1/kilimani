import { getTaxonomy, getProductById } from '../../actions'
import ProductForm from '@/components/inventory/ProductForm'
import { ArrowLeft, Settings2, Scissors, Sparkles, SprayCan } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Edit Product Architecture | Admin Dashboard",
}

// Visual Helper for the new Product Types
const getTypeIcon = (type: string) => {
  switch (type) {
    case 'accessory': return <Sparkles size={24} strokeWidth={1.5} />;
    case 'haircare': return <SprayCan size={24} strokeWidth={1.5} />;
    case 'hair': 
    default: return <Scissors size={24} strokeWidth={1.5} />;
  }
};

export default async function EditProductPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  
  // Concurrently fetch the taxonomy and the specific product ID from the URL[cite: 15]
  const [taxonomy, productRaw] = await Promise.all([
    getTaxonomy(),
    getProductById(params.id)
  ])

  // If the product doesn't exist in the database, trigger Next.js 404 page[cite: 15]
  if (!productRaw) {
    notFound()
  }

  // 1. FORMAT THE DATA SAFELY: 
  // Ensure the relational joins (category/collection) are flattened into single objects 
  // and arrays are guaranteed for variants and images to prevent strict-mode client crashes.
  const product = {
    ...productRaw,
    product_type: productRaw.product_type || 'hair',
    category: Array.isArray(productRaw.category) ? productRaw.category[0] : productRaw.category,
    collection: Array.isArray(productRaw.collection) ? productRaw.collection[0] : productRaw.collection,
    variants: productRaw.variants || [],
    product_images: productRaw.product_images || []
  };

  // 2. THE DYNAMIC NAMING ENGINE: Compute the display name for the header
  const categoryName = product.category?.name || 'Uncategorized';
  const collectionName = product.collection?.name ? `- ${product.collection.name}` : '';
  const computedName = `${categoryName} ${collectionName}`.trim();

  return (
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* Premium Header Section */}
      <div className="flex flex-col gap-5">
        <Link 
          href="/dashboard/inventory"
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground bg-secondary/40 hover:bg-secondary/80 border border-border/50 px-3 py-1.5 rounded-lg transition-all w-fit shadow-sm active:scale-95"
        >
          <ArrowLeft size={16} /> Return to Master Inventory
        </Link>
        
        <div className="flex items-start gap-4">
          <div className="hidden sm:flex mt-1 w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 items-center justify-center text-primary shrink-0 shadow-inner">
            {getTypeIcon(product.product_type)}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
                {computedName}
              </h1>
              <span className="hidden md:inline-flex px-2 py-1 bg-primary/10 text-primary border border-primary/20 rounded-md text-[10px] font-bold uppercase tracking-wider">
                {product.product_type}
              </span>
            </div>
            
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Settings2 size={14} className="opacity-70" />
              <p>
                Modifying structural matrix for <span className="font-mono text-xs uppercase bg-foreground/5 px-1.5 py-0.5 rounded ml-1">ID: {product.id.split('-')[0]}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative mt-2 border-t border-border/50 pt-6">
        {/* 🚨 This triggers Edit Mode because initialData is provided[cite: 15] */}
        <ProductForm taxonomy={taxonomy} initialData={product} />
      </div>
      
    </div>
  )
}