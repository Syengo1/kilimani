"use client"

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Loader2 } from 'lucide-react'
import { createFullProduct, updateFullProduct, VariantPayload } from '@/app/(admin)/dashboard/inventory/actions'
import { createClient } from '@/lib/supabase/client' 
import TaxonomySection, { ProductType } from './form/TaxonomySection'
import MediaSection, { ProductImage } from './form/MediaSection'
import VariantMatrix, { VariantState } from './form/VariantMatrix'

interface InitialProductData {
  id: string;
  product_type: ProductType;
  description?: string;
  category_id: string;
  collection_id: string | null;
  base_attributes: Record<string, string>;
  product_images?: ProductImage[];
  variants?: {
    id: string;
    sku: string;
    price_kes: number;
    cost_price_kes: number;
    discount_price_kes: number | null;
    stock_quantity: number;
    variant_attributes: Record<string, string>;
  }[];
}

interface ProductFormProps {
  taxonomy: {
    categories: { id: string; name: string }[]
    collections: { id: string; name: string }[]
  };
  initialData?: InitialProductData; 
}

export default function ProductForm({ taxonomy, initialData }: ProductFormProps) {
  const router = useRouter()
  const supabase = createClient() 
  const formTopRef = useRef<HTMLDivElement>(null)
  const isEditMode = !!initialData;
  
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sub-States Managed by the Orchestrator
  const [productType, setProductType] = useState<ProductType>(initialData?.product_type || 'hair')
  const [description, setDescription] = useState(initialData?.description || '')
  const [categoryId, setCategoryId] = useState(initialData?.category_id || '')
  const [collectionId, setCollectionId] = useState(initialData?.collection_id || '')
  
  const [existingImages, setExistingImages] = useState<ProductImage[]>(initialData?.product_images || [])
  const [deletedImageUrls, setDeletedImageUrls] = useState<string[]>([])
  const [newImages, setNewImages] = useState<File[]>([])
  const [newPreviewUrls, setNewPreviewUrls] = useState<string[]>([])

  const [variants, setVariants] = useState<VariantState[]>(() => {
    if (initialData?.variants && initialData.variants.length > 0) {
      return initialData.variants.map((v) => ({
        id: v.id, sku: v.sku, stock: v.stock_quantity, cost: v.cost_price_kes, 
        price: v.price_kes, discountPrice: v.discount_price_kes ?? '', attributes: v.variant_attributes || {}
      }));
    }
    return [{ id: Date.now(), sku: '', attributes: {}, stock: 0, cost: 0, price: 0, discountPrice: '' }];
  });
  
  const [deletedVariantIds, setDeletedVariantIds] = useState<string[]>([])

  const isWorking = isPending || isUploading;

  const triggerError = (msg: string) => {
    setError(msg)
    formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!categoryId) return triggerError("Please select a Category.")

    const cleanVariants = variants.map(v => ({ ...v, sku: v.sku.trim().toUpperCase() }))
    if (cleanVariants.some(v => !v.sku || v.price <= 0)) return triggerError("All variants must have a unique SKU and a valid selling price.")
    
    const skus = cleanVariants.map(v => v.sku);
    if (new Set(skus).size !== skus.length) return triggerError("Duplicate SKUs detected.");

    setIsUploading(true)
    const uploadedImageUrls: string[] = []

    try {
      for (const file of newImages) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('product-media').upload(`inventory/${fileName}`, file)
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage.from('product-media').getPublicUrl(`inventory/${fileName}`)
        uploadedImageUrls.push(publicUrl)
      }
    } catch (err) {
      // FIX: Utilize the 'err' variable to log actual network/storage issues to the console
      console.error("Storage upload error:", err);
      setIsUploading(false)
      return triggerError("Failed to upload images. Check network.")
    }

    startTransition(async () => {
      const productPayload = { product_type: productType, description: description.trim(), category_id: categoryId, collection_id: collectionId || null, base_attributes: {} }
      
      const variantPayload = cleanVariants.map(v => {
        // FIX: Replaced 'any' with the strictly imported VariantPayload interface
        const payload: VariantPayload = { 
          sku: v.sku, 
          stock_quantity: v.stock, 
          cost_price_kes: v.cost, 
          price_kes: v.price, 
          discount_price_kes: v.discountPrice === '' ? null : Number(v.discountPrice), 
          attributes: v.attributes 
        };
        if (typeof v.id === 'string') payload.id = v.id;
        return payload;
      })

      const result = isEditMode 
        ? await updateFullProduct(initialData.id, productPayload, variantPayload, uploadedImageUrls, deletedVariantIds, deletedImageUrls)
        : await createFullProduct(productPayload, variantPayload, uploadedImageUrls);
      
      if (result.success) router.push('/dashboard/inventory')
      else {
        setIsUploading(false)
        triggerError(result.error || "A database transaction error occurred.")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-48 md:pb-24 relative">
      <div ref={formTopRef} className="absolute -top-10" />

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm font-bold shadow-sm animate-in fade-in">
          {error}
        </div>
      )}

      <TaxonomySection 
        productType={productType} setProductType={setProductType}
        description={description} setDescription={setDescription}
        categoryId={categoryId} setCategoryId={setCategoryId}
        collectionId={collectionId} setCollectionId={setCollectionId}
        initialCategories={taxonomy.categories} initialCollections={taxonomy.collections}
        isWorking={isWorking}
      />

      <MediaSection 
        existingImages={existingImages} setExistingImages={setExistingImages}
        setDeletedImageUrls={setDeletedImageUrls}
        newImages={newImages} setNewImages={setNewImages}
        newPreviewUrls={newPreviewUrls} setNewPreviewUrls={setNewPreviewUrls}
        isWorking={isWorking}
      />

      <VariantMatrix 
        productType={productType}
        variants={variants} setVariants={setVariants}
        setDeletedVariantIds={setDeletedVariantIds}
        isWorking={isWorking}
      />

      <div className="fixed bottom-20 md:bottom-0 left-0 right-0 md:left-64 lg:left-72 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-background/80 backdrop-blur-xl border-t border-border z-40 flex justify-end">
        <button type="submit" disabled={isWorking} className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-70">
          {isWorking ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {isUploading ? 'Uploading Media...' : isPending ? 'Saving...' : isEditMode ? 'Commit Edits' : 'Save Product'}
        </button>
      </div>
    </form>
  )
}