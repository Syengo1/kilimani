"use server"

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// --- STRICT TYPES FOR ROBUSTNESS ---
export interface BaseProductPayload {
  title: string;
  category_id: string;
  collection_id: string | null;
  base_attributes: Record<string, any>;
}

export interface VariantPayload {
  id?: string; // 🚨 NEW: Optional. If it has an ID, we update. If not, we insert.
  sku: string;
  stock_quantity: number;
  cost_price_kes: number;
  price_kes: number;
  attributes: Record<string, any>;
}

// --- UTILITY: Extract Storage Path from Public URL ---
// Supabase needs the exact path (e.g. "inventory/123.jpg") to delete a file.
function extractStoragePath(publicUrl: string) {
  const bucketMarker = 'product-media/'
  const startIndex = publicUrl.indexOf(bucketMarker)
  if (startIndex === -1) return null
  return publicUrl.substring(startIndex + bucketMarker.length)
}

// ==========================================
// 1. INVENTORY FETCHING
// ==========================================

export async function getInventoryData() {
  const supabase = await createClient()

  const { data: products, error } = await supabase
    .from('products')
    .select(`
      id,
      title,
      created_at,
      category:categories(name),
      collection:collections(name),
      product_images(url, display_order),
      variants:product_variants(id, stock_quantity, price_kes, sku)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Inventory Fetch Error:", error.message)
    return []
  }

  return products || []
}

// 🚨 NEW: Fetch a single product for the Edit Form
export async function getProductById(id: string) {
  const supabase = await createClient()

  const { data: product, error } = await supabase
    .from('products')
    .select(`
      id,
      title,
      category_id,
      collection_id,
      base_attributes,
      product_images(id, url, display_order),
      variants:product_variants(id, sku, price_kes, cost_price_kes, stock_quantity, variant_attributes)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error("Fetch Product Error:", error.message)
    return null
  }

  // Ensure images are sorted by their intended display order
  if (product.product_images) {
    product.product_images.sort((a, b) => a.display_order - b.display_order)
  }

  return product
}

// ==========================================
// 2. TAXONOMY MANAGEMENT
// ==========================================

export async function getTaxonomy() {
  const supabase = await createClient()
  
  const [categories, collections] = await Promise.all([
    supabase.from('categories').select('id, name').order('name'),
    supabase.from('collections').select('id, name').order('name')
  ])

  return {
    categories: categories.data || [],
    collections: collections.data || []
  }
}

export async function createNewCategory(name: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .insert({ name: name.trim() })
    .select('id, name')
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, data }
}

export async function createNewCollection(name: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('collections')
    .insert({ name: name.trim() })
    .select('id, name')
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, data }
}

// ==========================================
// 3. MASTER PRODUCT CREATION & UPDATING
// ==========================================

export async function createFullProduct(
  productData: BaseProductPayload, 
  variantsData: VariantPayload[],
  imageUrls: string[] = []
) {
  const supabase = await createClient()

  const { data: product, error: productError } = await supabase
    .from('products')
    .insert({
      title: productData.title,
      category_id: productData.category_id,
      collection_id: productData.collection_id,
      base_attributes: productData.base_attributes
    })
    .select('id')
    .single()

  if (productError || !product) {
    return { success: false, error: "Failed to construct the base product shell." }
  }

  const variantsToInsert = variantsData.map(v => ({
    product_id: product.id,
    sku: v.sku,
    price_kes: v.price_kes,
    cost_price_kes: v.cost_price_kes,
    stock_quantity: v.stock_quantity,
    variant_attributes: v.attributes
  }))

  const { error: variantError } = await supabase.from('product_variants').insert(variantsToInsert)

  if (variantError) {
    await supabase.from('products').delete().eq('id', product.id)
    return { success: false, error: "Failed to save SKUs. Product creation was rolled back." }
  }

  if (imageUrls && imageUrls.length > 0) {
    const imagesToInsert = imageUrls.map((url, index) => ({
      product_id: product.id,
      url: url,
      display_order: index
    }))
    await supabase.from('product_images').insert(imagesToInsert)
  }

  revalidatePath('/dashboard/inventory')
  return { success: true }
}

// 🚨 NEW: The Master Update Action
export async function updateFullProduct(
  productId: string,
  productPayload: BaseProductPayload, 
  variantsPayload: VariantPayload[],
  newImageUrls: string[],
  deletedVariantIds: string[],
  deletedImageUrls: string[]
) {
  const supabase = await createClient()

  // 1. UPDATE Base Product
  const { error: productUpdateError } = await supabase
    .from('products')
    .update({
      title: productPayload.title,
      category_id: productPayload.category_id,
      collection_id: productPayload.collection_id,
      base_attributes: productPayload.base_attributes
    })
    .eq('id', productId)

  if (productUpdateError) {
    return { success: false, error: "Failed to update base product details." }
  }

  // 2. DELETE Removed Variants
  if (deletedVariantIds.length > 0) {
    await supabase.from('product_variants').delete().in('id', deletedVariantIds)
  }

  // 3. UPSERT Current Variants
  const variantsToUpsert = variantsPayload.map(v => {
    const payload: any = {
      product_id: productId,
      sku: v.sku,
      price_kes: v.price_kes,
      cost_price_kes: v.cost_price_kes,
      stock_quantity: v.stock_quantity,
      variant_attributes: v.attributes
    }
    if (v.id) payload.id = v.id // Presence of ID triggers an UPDATE instead of INSERT
    return payload
  })

  const { error: variantUpsertError } = await supabase
    .from('product_variants')
    .upsert(variantsToUpsert)

  if (variantUpsertError) {
    console.error("Variant Upsert Error:", variantUpsertError)
    return { success: false, error: "Failed to update SKU variants." }
  }

  // 4. DELETE Removed Images (SQL & Physical Storage)
  if (deletedImageUrls.length > 0) {
    // Delete from SQL table
    await supabase.from('product_images').delete().in('url', deletedImageUrls)

    // Delete physical files from Storage bucket
    const pathsToDelete = deletedImageUrls
      .map(extractStoragePath)
      .filter((path): path is string => path !== null)

    if (pathsToDelete.length > 0) {
      await supabase.storage.from('product-media').remove(pathsToDelete)
    }
  }

  // 5. INSERT New Images
  if (newImageUrls.length > 0) {
    // Determine the highest display_order so we append to the end
    const { data: existingImages } = await supabase
      .from('product_images')
      .select('display_order')
      .eq('product_id', productId)
      .order('display_order', { ascending: false })
      .limit(1)

    const startingOrder = existingImages && existingImages.length > 0 ? existingImages[0].display_order + 1 : 0

    const imagesToInsert = newImageUrls.map((url, index) => ({
      product_id: productId,
      url: url,
      display_order: startingOrder + index
    }))

    await supabase.from('product_images').insert(imagesToInsert)
  }

  revalidatePath('/dashboard/inventory')
  return { success: true }
}

// 🚨 NEW: The Master Delete Action
export async function deleteProduct(productId: string) {
  const supabase = await createClient()

  // 1. Fetch images so we know what to delete from the Storage Bucket
  const { data: images } = await supabase
    .from('product_images')
    .select('url')
    .eq('product_id', productId)

  // 2. Delete the physical files
  if (images && images.length > 0) {
    const pathsToDelete = images
      .map(img => extractStoragePath(img.url))
      .filter((path): path is string => path !== null)

    if (pathsToDelete.length > 0) {
      await supabase.storage.from('product-media').remove(pathsToDelete)
    }
  }

  // 3. Delete the SQL Row
  // (Because of ON DELETE CASCADE in your schema, this automatically deletes all variants and image records)
  const { error } = await supabase.from('products').delete().eq('id', productId)

  if (error) {
    return { success: false, error: "Failed to delete the product." }
  }

  revalidatePath('/dashboard/inventory')
  return { success: true }
}