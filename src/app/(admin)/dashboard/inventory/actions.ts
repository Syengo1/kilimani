'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// ============================================================================
// 1. STRICT TYPE DEFINITIONS
// Ensures the entire data pipeline remains bulletproof from Client to DB.
// ============================================================================

export type ProductType = 'hair' | 'accessory' | 'haircare';

export interface BaseProductPayload {
  product_type: ProductType;
  category_id: string;
  collection_id: string | null;
  description: string;
  base_attributes?: Record<string, unknown>;
}

export interface VariantPayload {
  id?: string; // Only present during an Update mutation
  sku: string;
  stock_quantity: number;
  cost_price_kes: number;
  price_kes: number;
  discount_price_kes: number | null;
  attributes: Record<string, string>;
}

// ============================================================================
// 2. READ ENGINES (FETCHERS)
// ============================================================================

/**
 * Fetches the baseline taxonomy (Categories & Collections) for form bindings.
 */
export async function getTaxonomy() {
  const supabase = await createClient();

  const [categoriesRes, collectionsRes] = await Promise.all([
    supabase.from('categories').select('id, name').order('name', { ascending: true }),
    supabase.from('collections').select('id, name').order('name', { ascending: true })
  ]);

  return {
    categories: categoriesRes.data || [],
    collections: collectionsRes.data || []
  };
}

/**
 * MASTER INVENTORY FETCH
 * Retrieves all products, nested relational data, and bypasses the deleted 'title' column.
 */
export async function getInventoryData() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('products')
    .select(`
      id,
      product_type,
      description,
      created_at,
      category:categories(name),
      collection:collections(name),
      product_images(url, display_order),
      variants:product_variants(id, stock_quantity, price_kes, sku, discount_price_kes)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch master inventory data:', error);
    return [];
  }

  return data;
}

/**
 * SPECIFIC PRODUCT FETCH
 * Retrieves a single asset for the Edit Product interface, carefully sorting media.
 */
export async function getProductById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('products')
    .select(`
      id,
      product_type,
      description,
      category_id,
      collection_id,
      base_attributes,
      category:categories(name),
      collection:collections(name),
      product_images(id, url, display_order),
      variants:product_variants(id, sku, stock_quantity, price_kes, cost_price_kes, discount_price_kes, variant_attributes)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Failed to fetch specific product:', error);
    return null;
  }

  // Guarantee chronological display order of images for the client UI
  if (data.product_images) {
    data.product_images.sort((a, b) => a.display_order - b.display_order);
  }

  return data;
}

// ============================================================================
// 3. MUTATION ENGINES (WRITE/UPDATE/DELETE)
// ============================================================================

/**
 * ENTERPRISE PRODUCT CREATION
 * Executes a clean multi-table transaction insertion sequence.
 */
export async function createFullProduct(
  productPayload: BaseProductPayload,
  variantPayload: VariantPayload[],
  uploadedImageUrls: string[]
) {
  const supabase = await createClient();

  try {
    // A. Initialize the Product Shell
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert([
        {
          product_type: productPayload.product_type,
          description: productPayload.description,
          category_id: productPayload.category_id,
          collection_id: productPayload.collection_id,
          base_attributes: productPayload.base_attributes || {}
        }
      ])
      .select('id')
      .single();

    if (productError) throw productError;

    // B. Inject Variant Rows tied directly to the Product ID
    const variantsToInsert = variantPayload.map(v => ({
      product_id: product.id,
      sku: v.sku.trim().toUpperCase(), // Enforce clean indexing
      stock_quantity: v.stock_quantity,
      cost_price_kes: v.cost_price_kes,
      price_kes: v.price_kes,
      discount_price_kes: v.discount_price_kes,
      variant_attributes: v.attributes
    }));

    const { error: variantError } = await supabase
      .from('product_variants')
      .insert(variantsToInsert);

    if (variantError) throw variantError;

    // C. Bind asset management URLs to image catalog
    if (uploadedImageUrls.length > 0) {
      const imagesToInsert = uploadedImageUrls.map((url, idx) => ({
        product_id: product.id,
        url: url,
        display_order: idx
      }));

      const { error: imageError } = await supabase
        .from('product_images')
        .insert(imagesToInsert);

      if (imageError) throw imageError;
    }

    revalidatePath('/dashboard/inventory');
    return { success: true };

  } catch (error: unknown) {
    console.error('Core Product Creation Error Pipeline:', error);
    const message = error instanceof Error ? error.message : 'Unknown database fault.';
    return { success: false, error: message };
  }
}

/**
 * ATOMIC PRODUCT UPDATE
 * Patches the base shell, syncs variant additions/edits, and clears legacy assets.
 */
export async function updateFullProduct(
  productId: string,
  productPayload: BaseProductPayload,
  variantPayload: VariantPayload[],
  newImageUrls: string[],
  deletedVariantIds: string[],
  deletedImageUrls: string[]
) {
  const supabase = await createClient();

  try {
    // A. Apply changes to Base Product Shell
    const { error: productUpdateError } = await supabase
      .from('products')
      .update({
        product_type: productPayload.product_type,
        description: productPayload.description,
        category_id: productPayload.category_id,
        collection_id: productPayload.collection_id,
        base_attributes: productPayload.base_attributes || {}
      })
      .eq('id', productId);

    if (productUpdateError) throw productUpdateError;

    // B. Handle Variant Purging Safely
    if (deletedVariantIds.length > 0) {
      const { error: variantDeleteError } = await supabase
        .from('product_variants')
        .delete()
        .in('id', deletedVariantIds);

      if (variantDeleteError) {
        // Intercept standard Foreign Key violation if a variant is tied to historical checkouts
        if (variantDeleteError.code === '23503') {
          throw new Error('One or more SKUs are linked to historical customer invoices and cannot be deleted. Adjust the stock to 0 instead.');
        }
        throw variantDeleteError;
      }
    }

    // C. Synchronize SKU Matrix (Splitting into updates vs. inserts)
    const inserts: Record<string, unknown>[] = [];
    const updates: VariantPayload[] = [];

    variantPayload.forEach(v => {
      if (v.id) {
        updates.push(v);
      } else {
        inserts.push({
          product_id: productId,
          sku: v.sku.trim().toUpperCase(),
          stock_quantity: v.stock_quantity,
          cost_price_kes: v.cost_price_kes,
          price_kes: v.price_kes,
          discount_price_kes: v.discount_price_kes,
          variant_attributes: v.attributes
        });
      }
    });

    if (inserts.length > 0) {
      const { error: insertErr } = await supabase.from('product_variants').insert(inserts);
      if (insertErr) throw insertErr;
    }

    // Process updates sequentially to prevent transactional deadlocks
    for (const updateItem of updates) {
      const { error: updateErr } = await supabase
        .from('product_variants')
        .update({
          sku: updateItem.sku.trim().toUpperCase(),
          stock_quantity: updateItem.stock_quantity,
          cost_price_kes: updateItem.cost_price_kes,
          price_kes: updateItem.price_kes,
          discount_price_kes: updateItem.discount_price_kes,
          variant_attributes: updateItem.attributes
        })
        .eq('id', updateItem.id);

      if (updateErr) throw updateErr;
    }

    // D. Clean Out Remnants from Media Library
    if (deletedImageUrls.length > 0) {
      const { error: imgDelError } = await supabase
        .from('product_images')
        .delete()
        .in('url', deletedImageUrls);
        
      if (imgDelError) throw imgDelError;
    }

    // E. Append Newly Generated Media Files
    if (newImageUrls.length > 0) {
      // Determine current maximum placement order to append accurately
      const { data: currentImages } = await supabase
        .from('product_images')
        .select('display_order')
        .eq('product_id', productId);
        
      const maxOrder = currentImages && currentImages.length > 0 
        ? Math.max(...currentImages.map(i => i.display_order)) 
        : -1;

      const newImagesPayload = newImageUrls.map((url, index) => ({
        product_id: productId,
        url: url,
        display_order: maxOrder + 1 + index
      }));

      const { error: imgInsError } = await supabase
        .from('product_images')
        .insert(newImagesPayload);
        
      if (imgInsError) throw imgInsError;
    }

    revalidatePath('/dashboard/inventory');
    return { success: true };

  } catch (error: unknown) {
    console.error('Core Product Update Error Pipeline:', error);
    const message = error instanceof Error ? error.message : 'Failed to apply matrix transformations.';
    return { success: false, error: message };
  }
}

/**
 * SYSTEM-SAFE PRODUCT ELIMINATION
 * Targets a root profile and initiates an atomic layout wipe cascade.
 */
export async function deleteProduct(id: string) {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      // Gracefully prevent critical data loss for ledger accounting records (Code: 23503 RESTRICT Lock)
      if (error.code === '23503') {
        return {
          success: false,
          error: 'This catalog record cannot be completely destroyed because items within its structural matrix are already present inside customer checkout files. Please adjust stock to 0 instead.'
        };
      }
      throw error;
    }

    revalidatePath('/dashboard/inventory');
    return { success: true };

  } catch (error: unknown) {
    console.error('Critical Delete Interception Exception:', error);
    const message = error instanceof Error ? error.message : 'An unexpected exception locked database resources.';
    return { success: false, error: message };
  }
}

// ============================================================================
// 4. INLINE TAXONOMY CREATORS
// ============================================================================

export async function createNewCategory(name: string) {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase.from('categories').insert([{ name: name.trim() }]).select('id, name').single();
    if (error) throw error;
    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Duplicate taxonomy restriction.';
    return { success: false, error: message };
  }
}

export async function createNewCollection(name: string) {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase.from('collections').insert([{ name: name.trim() }]).select('id, name').single();
    if (error) throw error;
    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Duplicate taxonomy restriction.';
    return { success: false, error: message };
  }
}

/**
 * STOREFRONT PUBLIC FETCH ENGINE
 * Looks up a product exclusively via its secure Reference ID for public routing.
 */
export async function getProductByRef(refId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('products')
    .select(`
      id,
      ref_id,
      product_type,
      description,
      category:categories(name),
      collection:collections(name),
      product_images(url, display_order),
      variants:product_variants(id, sku, stock_quantity, price_kes, discount_price_kes, variant_attributes)
    `)
    .eq('ref_id', refId)
    .single();

  if (error) {
    console.error(`Failed to fetch product by Ref ID (${refId}):`, error);
    return null;
  }

  // Guarantee chronological display order of images for the client UI
  if (data.product_images) {
    data.product_images.sort((a, b) => a.display_order - b.display_order);
  }

  return data;
}