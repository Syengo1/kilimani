"use client"

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Plus, Trash2, Layers, Loader2, UploadCloud, X, PlusCircle, Check } from 'lucide-react'
import { createFullProduct, updateFullProduct, createNewCategory, createNewCollection } from '@/app/(admin)/dashboard/inventory/actions'
import { createClient } from '@/lib/supabase/client' 
import Image from 'next/image'

interface Taxonomy {
  categories: { id: string; name: string }[]
  collections: { id: string; name: string }[]
}

interface ProductImage {
  id: string;
  url: string;
  display_order: number;
}

interface VariantState {
  id: string | number; // DB uses string UUIDs. New local rows use number timestamps.
  sku: string;
  stock: number;
  cost: number;
  price: number;
  attributes: { length: string; color: string };
}

interface InitialProductData {
  id: string;
  title: string;
  category_id: string;
  collection_id: string | null;
  base_attributes: Record<string, string>;
  product_images?: ProductImage[];
  variants?: {
    id: string;
    sku: string;
    price_kes: number;
    cost_price_kes: number;
    stock_quantity: number;
    variant_attributes: { length: string; color: string };
  }[];
}

interface ProductFormProps {
  taxonomy: Taxonomy;
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

  // --- LOCAL TAXONOMY STATE ---
  const [categories, setCategories] = useState(taxonomy.categories)
  const [collections, setCollections] = useState(taxonomy.collections)

  // --- 1. BASE PRODUCT STATE ---
  const [title, setTitle] = useState(initialData?.title || '')
  const [categoryId, setCategoryId] = useState(initialData?.category_id || '')
  const [collectionId, setCollectionId] = useState(initialData?.collection_id || '')
  
  // --- INLINE CREATOR STATE ---
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isSavingCategory, setIsSavingCategory] = useState(false)

  const [isAddingCollection, setIsAddingCollection] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [isSavingCollection, setIsSavingCollection] = useState(false)
  
  // --- 2. MEDIA STATE (Split into Existing vs New) ---
  const [existingImages, setExistingImages] = useState<ProductImage[]>(initialData?.product_images || [])
  const [deletedImageUrls, setDeletedImageUrls] = useState<string[]>([])
  
  const [newImages, setNewImages] = useState<File[]>([])
  const [newPreviewUrls, setNewPreviewUrls] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // --- 3. VARIANT MATRIX STATE ---
  // 
  
  const [variants, setVariants] = useState<VariantState[]>(() => {
    if (initialData?.variants && initialData.variants.length > 0) {
      return initialData.variants.map((v) => ({
        id: v.id, 
        sku: v.sku, 
        stock: v.stock_quantity, 
        cost: v.cost_price_kes, 
        price: v.price_kes, 
        attributes: v.variant_attributes || { length: '', color: '' }
      }));
    }
    
    // Fallback if creating a new product
    return [{ id: Date.now(), sku: '', attributes: { length: '', color: '' }, stock: 0, cost: 0, price: 0 }];
  });

  const [deletedVariantIds, setDeletedVariantIds] = useState<string[]>([])
  const isWorking = isPending || isUploading || isSavingCategory || isSavingCollection;

  // --- HELPER: Trigger Error & Scroll to Top ---
  const triggerError = (msg: string) => {
    setError(msg)
    formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // --- INLINE CREATION HANDLERS ---
  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) return setIsAddingCategory(false)
    setIsSavingCategory(true)
    const res = await createNewCategory(newCategoryName)
    if (res.success && res.data) {
      setCategories(prev => [...prev, res.data])
      setCategoryId(res.data.id) 
      setNewCategoryName('')
      setIsAddingCategory(false)
    } else {
      triggerError(res.error || "Failed to create category.")
    }
    setIsSavingCategory(false)
  }

  const handleSaveCollection = async () => {
    if (!newCollectionName.trim()) return setIsAddingCollection(false)
    setIsSavingCollection(true)
    const res = await createNewCollection(newCollectionName)
    if (res.success && res.data) {
      setCollections(prev => [...prev, res.data])
      setCollectionId(res.data.id)
      setNewCollectionName('')
      setIsAddingCollection(false)
    } else {
      triggerError(res.error || "Failed to create collection.")
    }
    setIsSavingCollection(false)
  }

  // --- MEDIA HANDLERS ---
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      setNewImages(prev => [...prev, ...selectedFiles])
      const urls = selectedFiles.map(file => URL.createObjectURL(file))
      setNewPreviewUrls(prev => [...prev, ...urls])
    }
  }

  const removeNewImage = (indexToRemove: number) => {
    setNewImages(prev => prev.filter((_, idx) => idx !== indexToRemove))
    setNewPreviewUrls(prev => {
      URL.revokeObjectURL(prev[indexToRemove])
      return prev.filter((_, idx) => idx !== indexToRemove)
    })
  }

  const removeExistingImage = (idToRemove: string, urlToRemove: string) => {
    // Hide from UI and queue for server deletion
    setExistingImages(prev => prev.filter(img => img.id !== idToRemove))
    setDeletedImageUrls(prev => [...prev, urlToRemove])
  }

  // --- VARIANT HANDLERS ---
  const addVariantRow = () => {
    setVariants([...variants, { id: Date.now(), sku: '', attributes: { length: '', color: '' }, stock: 0, cost: 0, price: 0 }])
  }

  const updateVariant = <K extends keyof Omit<VariantState, 'attributes'>>(id: string | number, field: K, value: VariantState[K]) => {
    setVariants(variants.map(v => v.id === id ? { ...v, [field]: value } : v))
  }

  const updateVariantAttribute = (id: string | number, attrKey: 'length' | 'color', value: string) => {
    setVariants(variants.map(v => v.id === id ? { ...v, attributes: { ...v.attributes, [attrKey]: value } } : v))
  }

  const removeVariant = (idToRemove: string | number) => {
    if (variants.length > 1) {
      // If it's a string, it means it's a UUID from the database. Queue it for deletion.
      if (typeof idToRemove === 'string') {
        setDeletedVariantIds(prev => [...prev, idToRemove])
      }
      setVariants(variants.filter(v => v.id !== idToRemove))
    }
  }

  // --- SUBMISSION HANDLER ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim() || !categoryId) {
      triggerError("Please ensure the Base Product Title and Category are filled out.")
      return
    }

    const cleanVariants = variants.map(v => ({
      ...v,
      sku: v.sku.trim().toUpperCase() 
    }))

    if (cleanVariants.some(v => !v.sku || v.price <= 0)) {
      triggerError("All variants must have a unique SKU and a valid selling price greater than 0.")
      return
    }

    const skus = cleanVariants.map(v => v.sku);
    if (new Set(skus).size !== skus.length) {
      triggerError("Duplicate SKUs detected. Every variant row must have a completely unique SKU.");
      return;
    }

    setIsUploading(true)

    // Upload New Images to Supabase
    const uploadedImageUrls: string[] = []
    try {
      for (const file of newImages) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `inventory/${fileName}`

        const { error: uploadError } = await supabase.storage.from('product-media').upload(filePath, file, { cacheControl: '3600', upsert: false })
        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage.from('product-media').getPublicUrl(filePath)
        uploadedImageUrls.push(publicUrl)
      }
    } catch (err) {
      console.error("Storage upload error:", err)
      triggerError("Failed to upload images. Please check your network connection.")
      setIsUploading(false)
      return 
    }

    // Commit to Database
    startTransition(async () => {
      const productPayload = {
        title: title.trim(),
        category_id: categoryId,
        collection_id: collectionId || null,
        base_attributes: { material: "100% Human Hair", origin: "Imported" } 
      }

      const variantPayload = cleanVariants.map(v => {
        const payload: {
          sku: string;
          stock_quantity: number;
          cost_price_kes: number;
          price_kes: number;
          attributes: { length: string; color: string };
          id?: string;
        } = {
          sku: v.sku,
          stock_quantity: v.stock,
          cost_price_kes: v.cost,
          price_kes: v.price,
          attributes: v.attributes
        };
        
        // Only attach ID if it's a DB string. This tells the server to UPDATE instead of INSERT.
        if (typeof v.id === 'string') payload.id = v.id;
        return payload;
      })

      let result;
      if (isEditMode) {
        result = await updateFullProduct(initialData.id, productPayload, variantPayload, uploadedImageUrls, deletedVariantIds, deletedImageUrls);
      } else {
        result = await createFullProduct(productPayload, variantPayload, uploadedImageUrls);
      }
      
      if (result.success) {
        router.push('/dashboard/inventory')
      } else {
        triggerError(result.error || "A database transaction error occurred.")
        setIsUploading(false)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-48 md:pb-24 relative">
      <div ref={formTopRef} className="absolute -top-10" />

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm font-bold shadow-sm animate-in fade-in slide-in-from-top-2">
          {error}
        </div>
      )}

      {/* SECTION 1: BASE PRODUCT IDENTIFICATION */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-4">
          1. Base Product
        </h2>
        
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-foreground/60 uppercase tracking-widest">Product Title</label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isWorking}
            placeholder="e.g. Peruvian Body Wave Lace Frontal" 
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors shadow-sm disabled:opacity-50"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                <input 
                  autoFocus
                  type="text" 
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSaveCategory())}
                  placeholder="New Category Name..." 
                  className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 shadow-sm"
                />
                <button type="button" onClick={handleSaveCategory} disabled={isSavingCategory} className="p-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all shadow-sm">
                  {isSavingCategory ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                </button>
                <button type="button" onClick={() => { setIsAddingCategory(false); setNewCategoryName(''); }} className="p-2.5 bg-secondary text-muted-foreground rounded-xl hover:text-foreground transition-all shadow-sm">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <select 
                value={categoryId} 
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={isWorking}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors appearance-none shadow-sm font-medium disabled:opacity-50"
              >
                <option value="">Select a Category...</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
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
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                <input 
                  autoFocus
                  type="text" 
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSaveCollection())}
                  placeholder="New Collection Name..." 
                  className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 shadow-sm"
                />
                <button type="button" onClick={handleSaveCollection} disabled={isSavingCollection} className="p-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all shadow-sm">
                  {isSavingCollection ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                </button>
                <button type="button" onClick={() => { setIsAddingCollection(false); setNewCollectionName(''); }} className="p-2.5 bg-secondary text-muted-foreground rounded-xl hover:text-foreground transition-all shadow-sm">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <select 
                value={collectionId} 
                onChange={(e) => setCollectionId(e.target.value)}
                disabled={isWorking}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors appearance-none shadow-sm font-medium disabled:opacity-50"
              >
                <option value="">None (Standalone Product)</option>
                {collections.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: MEDIA & ASSETS */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-border/50 pb-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            2. Product Media
          </h2>
          <span className="text-[10px] uppercase font-bold text-muted-foreground bg-secondary px-2 py-1 rounded-md">
            {existingImages.length + newImages.length} Attached
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div 
            onClick={() => !isWorking && fileInputRef.current?.click()}
            className={`col-span-1 sm:col-span-2 md:col-span-4 lg:col-span-1 h-32 rounded-xl border-2 border-dashed border-border/60 flex flex-col items-center justify-center transition-all ${isWorking ? 'bg-secondary/20 cursor-not-allowed opacity-50' : 'bg-background/50 hover:bg-secondary/50 hover:border-primary/50 cursor-pointer group'}`}
          >
            <UploadCloud className="text-muted-foreground mb-2 group-hover:text-primary transition-colors" size={24} />
            <p className="text-xs font-bold text-foreground/70">Click to upload</p>
            <p className="text-[10px] text-muted-foreground mt-1">High-res WebP or JPG</p>
            <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" multiple className="hidden" disabled={isWorking} />
          </div>

          {/* Render Existing DB Images */}
          {existingImages.map((img, idx) => (
            <div key={img.id} className="relative h-32 rounded-xl border border-border overflow-hidden">
              <Image src={img.url} alt={`Existing ${idx}`} fill className="object-cover" unoptimized />
              {!isWorking && (
                <button 
                  type="button" 
                  onClick={() => removeExistingImage(img.id, img.url)} 
                  className="absolute top-2 right-2 p-1.5 bg-background/80 backdrop-blur text-foreground border border-border rounded-md hover:bg-red-500 hover:text-white transition-colors shadow-sm z-10"
                >
                  <X size={14} />
                </button>
              )}
              {idx === 0 && (
                <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur text-foreground text-[9px] font-black uppercase px-2 py-1 rounded-md shadow-sm border border-border/50">
                  Main Thumbnail
                </div>
              )}
            </div>
          ))}

          {/* Render Newly Uploaded Local Blobs */}
          {newPreviewUrls.map((url, idx) => (
            <div key={url} className="relative h-32 rounded-xl border border-primary/50 overflow-hidden shadow-[0_0_0_2px_rgba(var(--primary),0.2)]">
              <Image src={url} alt={`New ${idx}`} fill className="object-cover" unoptimized />
              {!isWorking && (
                <button 
                  type="button" 
                  onClick={() => removeNewImage(idx)} 
                  className="absolute top-2 right-2 p-1.5 bg-background/80 backdrop-blur text-foreground border border-border rounded-md hover:bg-red-500 hover:text-white transition-colors shadow-sm z-10"
                >
                  <X size={14} />
                </button>
              )}
              <div className="absolute bottom-2 right-2 bg-primary/90 backdrop-blur text-primary-foreground text-[9px] font-black uppercase px-2 py-1 rounded-md shadow-sm">
                New
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: SKU VARIANT MATRIX */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
        <div className="relative z-20 p-5 border-b border-border bg-background/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest">3. SKU Variant Matrix</h2>
              <p className="text-xs text-foreground/50 mt-0.5">Define lengths, colors, and stock levels.</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={(e) => { e.preventDefault(); addVariantRow(); }} 
            disabled={isWorking} 
            className="relative z-30 flex items-center justify-center gap-2 px-4 py-3.5 sm:py-2.5 w-full sm:w-auto bg-card border-2 border-border rounded-xl text-xs font-bold hover:bg-secondary active:scale-95 transition-all shadow-sm disabled:opacity-50 touch-manipulation cursor-pointer"
          >
            <Plus size={16} className="pointer-events-none" /> Add SKU Row
          </button>
        </div>

        <div className="p-4 md:p-6 space-y-4">
          {variants.map((v, index) => (
            <div key={v.id} className="grid grid-cols-2 md:grid-cols-7 gap-4 p-4 pt-12 md:pt-4 rounded-xl border border-border/60 bg-background/40 hover:border-primary/30 transition-colors relative group">
              <div className="col-span-2 md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider">Unique SKU</label>
                <input type="text" disabled={isWorking} placeholder={`SKU-00${index + 1}`} value={v.sku} onChange={(e) => updateVariant(v.id, 'sku', e.target.value)} className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary/50 uppercase font-mono shadow-sm disabled:opacity-50" />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider">Length</label>
                <input type="text" disabled={isWorking} placeholder='e.g. 14"' value={v.attributes.length} onChange={(e) => updateVariantAttribute(v.id, 'length', e.target.value)} className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary/50 shadow-sm disabled:opacity-50" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider">Color</label>
                <input type="text" disabled={isWorking} placeholder='e.g. 1B' value={v.attributes.color} onChange={(e) => updateVariantAttribute(v.id, 'color', e.target.value)} className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary/50 shadow-sm disabled:opacity-50" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider">Stock</label>
                <input type="number" min="0" disabled={isWorking} value={v.stock} onChange={(e) => updateVariant(v.id, 'stock', parseInt(e.target.value) || 0)} className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary/50 shadow-sm font-mono disabled:opacity-50" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider">Cost</label>
                <input type="number" min="0" disabled={isWorking} value={v.cost} onChange={(e) => updateVariant(v.id, 'cost', parseInt(e.target.value) || 0)} className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary/50 shadow-sm font-mono disabled:opacity-50" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-primary uppercase tracking-wider">Sell Price</label>
                <input type="number" min="0" disabled={isWorking} value={v.price} onChange={(e) => updateVariant(v.id, 'price', parseInt(e.target.value) || 0)} className="w-full bg-primary/5 border border-primary/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary font-bold text-primary shadow-sm font-mono disabled:opacity-50" />
              </div>

              {!isWorking && (
                <button 
                  type="button" 
                  onClick={() => removeVariant(v.id)} 
                  disabled={variants.length === 1} 
                  className="absolute right-3 top-3 p-2 bg-background/80 border border-border/50 rounded-lg text-muted-foreground hover:text-red-500 hover:border-red-200 hover:bg-red-50 disabled:opacity-0 transition-all shadow-sm z-10"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <div className="fixed bottom-20 md:bottom-0 left-0 right-0 md:left-64 lg:left-72 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-background/80 backdrop-blur-xl border-t border-border z-40 flex justify-end">
        <button 
          type="submit" 
          disabled={isWorking} 
          className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-70"
        >
          {isWorking ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {isUploading ? 'Uploading Media...' : isPending ? 'Saving to Database...' : isEditMode ? 'Commit Edits' : 'Finalize & Save Product'}
        </button>
      </div>
    </form>
  )
}