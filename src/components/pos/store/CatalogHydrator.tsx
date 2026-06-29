'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { usePOSStore, POSProduct, POSVariant } from './posStore'; // Fixed import path
import { toast } from 'sonner';

// ==========================================
// STRICT DATABASE TYPES
// Eliminates the ESLint "Unexpected any" errors
// ==========================================
interface RawProductImage {
  url: string;
  display_order: number;
}

interface RawSupabaseProduct {
  id: string;
  ref_id: string;
  product_type: string;
  base_attributes: { name?: string; title?: string } | null;
  variants: POSVariant[];
  images: RawProductImage[] | null;
}

export function CatalogHydrator() {
  const { setCatalog } = usePOSStore();

  useEffect(() => {
    async function fetchCatalog() {
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;
      
      const supabase = createClient();

      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            id,
            ref_id,
            product_type,
            base_attributes,
            variants:product_variants(id, sku, price_kes, discount_price_kes, stock_quantity, variant_attributes),
            images:product_images(url, display_order)
          `);

        if (error) throw error;

        if (data) {
          // Cast the raw data to our strict interface
          const rawData = data as RawSupabaseProduct[];

          // Safely map to the strictly defined POSProduct array
          const formattedCatalog: POSProduct[] = rawData.map((p) => ({
            id: p.id,
            ref_id: p.ref_id, // Added to strictly satisfy the POSProduct interface
            title: p.base_attributes?.name || p.base_attributes?.title || `Product ${p.ref_id}`,
            product_type: p.product_type,
            images: p.images?.sort((a: RawProductImage, b: RawProductImage) => a.display_order - b.display_order) || [],
            variants: p.variants || []
          }));

          setCatalog(formattedCatalog);
          console.log('[Catalog Hydrator] Successfully cached', formattedCatalog.length, 'products.');
        }
      } catch (err) {
        console.error('[Catalog Hydrator] Database fetch failed:', err);
        toast.error('Failed to pull latest inventory. Using cached offline data.');
      }
    }

    fetchCatalog();

    const handleTrigger = () => {
      toast.info('Syncing catalog from database...');
      fetchCatalog();
    };
    
    window.addEventListener('trigger-catalog-sync', handleTrigger);
    return () => window.removeEventListener('trigger-catalog-sync', handleTrigger);
  }, [setCatalog]);

  return null;
}