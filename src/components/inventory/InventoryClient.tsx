"use client"

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Filter, Layers, SearchX, Image as ImageIcon, Box, Edit2, Trash2, Loader2, Scissors, Sparkles, SprayCan } from 'lucide-react'
import Image from 'next/image'
import { deleteProduct } from '@/app/(admin)/dashboard/inventory/actions'

// --- STRICT TYPES ---
type ProductType = 'hair' | 'accessory' | 'haircare';

interface Variant {
  id: string
  stock_quantity: number
  price_kes: number
  sku: string
}

interface ProductImage {
  url: string;
  display_order?: number;
}

// 🚨 UPDATED: Removed `title`, added `product_type`
interface Product {
  id: string
  product_type: ProductType 
  category: { name: string } | null
  collection: { name: string } | null
  variants: Variant[]
  product_images?: ProductImage[] 
}

interface InventoryClientProps {
  initialData: Product[]
  taxonomy: {
    categories: { id: string; name: string }[]
    collections: { id: string; name: string }[]
  }
}

export function InventoryClient({ initialData, taxonomy }: InventoryClientProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  
  // Robust Loading State for Deletions
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // ==========================================
  // DYNAMIC NAMING ENGINE
  // Computes the display name instantly since 'title' no longer exists.
  // ==========================================
  const productsWithComputedNames = initialData.map(product => {
    const categoryName = product.category?.name || 'Uncategorized';
    const collectionName = product.collection?.name ? `- ${product.collection.name}` : '';
    const computedName = `${categoryName} ${collectionName}`.trim();
    
    return { ...product, computedName };
  });

  // Filter against the new computed names and SKUs
  const filteredData = productsWithComputedNames.filter(product => 
    product.computedName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.variants.some(v => v.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // --- HANDLERS ---
  const handleEdit = (id: string) => {
    router.push(`/dashboard/inventory/${id}/edit`)
  }

  const handleDelete = (e: React.MouseEvent, id: string, computedName: string) => {
    e.stopPropagation() 

    // Enterprise safeguard: Prevent accidental deletions
    if (!window.confirm(`Are you sure you want to permanently delete "${computedName}"?\n\nThis will instantly destroy all SKUs and permanently delete all images associated with this product from the server. This action cannot be undone.`)) {
      return
    }

    setDeletingId(id)
    startTransition(async () => {
      const result = await deleteProduct(id)
      if (!result.success) {
        alert(result.error) // Fallback error alert if server fails due to RESTRICT lock
      }
      setDeletingId(null)
    })
  }

  // --- UTILITY: Product Type Icon Resolver ---
  const getTypeIcon = (type: ProductType) => {
    switch (type) {
      case 'hair': return <Scissors size={12} className="mr-1" />;
      case 'accessory': return <Sparkles size={12} className="mr-1" />;
      case 'haircare': return <SprayCan size={12} className="mr-1" />;
      default: return <Box size={12} className="mr-1" />;
    }
  }

  return (
    <div className="flex flex-col h-full w-full">
      
      {/* ==========================================
          UTILITY TOOLBAR
          ========================================== */}
      <div className="p-4 md:p-5 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-3 bg-background/50">
        <div className="relative w-full sm:max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search categories, collections, or SKUs..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 sm:py-2.5 text-sm bg-card border border-border rounded-xl focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50 shadow-sm"
          />
        </div>

        <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 bg-card border border-border text-sm font-bold rounded-xl hover:bg-secondary/50 active:scale-95 transition-all shadow-sm">
          <Filter size={16} /> Filters
        </button>
      </div>

      {/* ==========================================
          WORKSPACE
          ========================================== */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        {filteredData.length === 0 ? (
           <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-background/50 overflow-y-auto">
             <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
               <SearchX size={32} className="text-muted-foreground/50" />
             </div>
             <h3 className="text-lg font-black tracking-tight">No Matches Found</h3>
             <p className="text-sm text-muted-foreground mt-2 max-w-xs">
               We couldn&apos;t find any products or SKUs matching &quot;<span className="text-foreground font-bold">{searchTerm}</span>&quot;.
             </p>
           </div>
        ) : (
          <>
            {/* ==========================================
                MOBILE VIEW: Stacked Touch Cards
                ========================================== */}
            <div className="md:hidden flex flex-col overflow-y-auto custom-scrollbar divide-y divide-border/50 bg-background/30 pb-20">
              {filteredData.map((product) => {
                const totalStock = product.variants.reduce((acc, v) => acc + v.stock_quantity, 0)
                const mainImage = product.product_images?.[0]?.url
                const isDeleting = deletingId === product.id

                return (
                  <div 
                    key={product.id} 
                    onClick={() => handleEdit(product.id)}
                    className={`flex flex-col gap-3 p-4 active:bg-secondary/50 transition-colors cursor-pointer ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <div className="flex gap-4">
                      {/* Mobile Thumbnail */}
                      <div className="relative w-20 h-20 shrink-0 rounded-xl border border-border/50 bg-card overflow-hidden flex items-center justify-center shadow-sm">
                        {mainImage ? (
                          <Image src={mainImage} alt={product.computedName} fill className="object-cover" unoptimized />
                        ) : (
                          <ImageIcon size={24} className="text-muted-foreground/30" />
                        )}
                      </div>

                      {/* Mobile Details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div>
                          <h4 className="font-bold text-sm text-foreground truncate">{product.computedName}</h4>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[10px] font-mono text-muted-foreground uppercase bg-foreground/5 px-1.5 py-0.5 rounded-md">ID: {product.id.split('-')[0]}</span>
                            <span className="text-[10px] flex items-center font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md uppercase">
                              {getTypeIcon(product.product_type)} {product.product_type}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border shadow-sm ${
                            totalStock > 10 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                            totalStock > 0  ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 
                            'bg-red-500/10 text-red-600 border-red-500/20'
                          }`}>
                            {totalStock} Units
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Mobile Action Bar */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleEdit(product.id); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-bold shadow-sm"
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                      <button 
                        onClick={(e) => handleDelete(e, product.id, product.computedName)}
                        disabled={isDeleting}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-600 border border-red-500/20 text-xs font-bold shadow-sm"
                      >
                        {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} 
                        Delete
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* ==========================================
                DESKTOP VIEW: Data Table
                ========================================== */}
            <div className="hidden md:block overflow-x-auto custom-scrollbar flex-1 pb-20">
              <table className="w-full text-left border-collapse min-w-[950px]">
                <thead>
                  <tr className="bg-card/90 backdrop-blur-md border-b border-border text-[10px] font-black uppercase tracking-widest text-muted-foreground sticky top-0 z-10 shadow-sm">
                    <th className="px-6 py-4 w-20">Media</th>
                    <th className="px-6 py-4">Product Classification</th>
                    <th className="px-6 py-4">Architecture</th>
                    <th className="px-6 py-4">SKU Count</th>
                    <th className="px-6 py-4">Global Stock</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredData.map((product) => {
                    const totalStock = product.variants.reduce((acc, v) => acc + v.stock_quantity, 0)
                    const mainImage = product.product_images?.[0]?.url
                    const isDeleting = deletingId === product.id
                    
                    return (
                      <tr 
                        key={product.id} 
                        onClick={() => handleEdit(product.id)}
                        className={`group hover:bg-secondary/40 transition-colors duration-200 cursor-pointer bg-background/50 ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
                      >
                        
                        {/* Desktop Thumbnail */}
                        <td className="px-6 py-4">
                          <div className="relative w-12 h-12 rounded-lg border border-border bg-card overflow-hidden flex items-center justify-center shadow-sm">
                            {mainImage ? (
                              <Image src={mainImage} alt={product.computedName} fill className="object-cover group-hover:scale-110 transition-transform duration-500" unoptimized />
                            ) : (
                              <ImageIcon size={20} className="text-muted-foreground/30" />
                            )}
                          </div>
                        </td>

                        {/* Computed Product Name & ID */}
                        <td className="px-6 py-4">
                          <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{product.computedName}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 font-mono uppercase">ID: {product.id.split('-')[0]}</p>
                        </td>

                        {/* Taxonomy & Product Type Badges */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="flex items-center px-2 py-1 bg-primary/10 text-primary border border-primary/20 rounded-md text-[10px] font-bold uppercase tracking-wider">
                              {getTypeIcon(product.product_type)} {product.product_type}
                            </span>
                            {product.collection?.name && (
                              <span className="px-2 py-1 bg-card border border-border text-muted-foreground rounded-md text-[10px] font-bold uppercase tracking-wider">
                                {product.collection.name}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm font-medium text-foreground/70">
                            <Layers size={14} className="text-muted-foreground" />
                            {product.variants.length} Matrix Rows
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border shadow-sm ${
                            totalStock > 10 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                            totalStock > 0  ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 
                            'bg-red-500/10 text-red-600 border-red-500/20'
                          }`}>
                            {totalStock} Units
                          </span>
                        </td>
                        
                        {/* Desktop Actions Row */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleEdit(product.id); }}
                              className="p-2 rounded-lg bg-background border border-border text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary shadow-sm transition-all"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={(e) => handleDelete(e, product.id, product.computedName)}
                              disabled={isDeleting}
                              className="p-2 rounded-lg bg-background border border-border text-muted-foreground hover:bg-red-500 hover:text-white hover:border-red-500 shadow-sm transition-all disabled:opacity-50"
                            >
                              {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}