import { createClient } from '@/lib/supabase/server';
import HeroSection from '@/components/home/HeroSection';
import FeaturedCollections from '@/components/home/FeaturedCollections';
import Footer from '@/components/layout/Footer';
import { Product } from '@/components/storefront/ProductCard';
import CartAutoOpener from '@/components/storefront/CartAutoOpener';

// Revalidate the homepage cache every 60 seconds to keep stock and prices fresh
export const revalidate = 60;

// 1. STRICT SUPABASE JOIN TYPING
// Matches the exact shape of our newly upgraded relational database query
type SupabaseProductJoin = {
  id: string;
  ref_id: string;
  product_type: 'hair' | 'accessory' | 'haircare' | string;
  description?: string | null;
  base_attributes: Record<string, unknown> | null;
  category: { name: string } | { name: string }[] | null;
  collection: { name: string } | { name: string }[] | null;
  product_images: { id: string; url: string; display_order: number }[];
  product_variants: { 
    id: string; 
    sku: string;
    price_kes: number | string; 
    discount_price_kes?: number | string | null;
    stock_quantity: number; 
    variant_attributes: Record<string, string>; 
  }[];
};

export default async function HomePage() {
  const supabase = await createClient();

  // 1. ENTERPRISE DATA FETCHING
  // We query the new ref_id, taxonomy relations, and dynamic pricing matrix
  const { data: productsData, error } = await supabase
    .from('products')
    .select(`
      id,
      ref_id,
      product_type,
      description,
      base_attributes,
      category:categories(name),
      collection:collections(name),
      product_images(
        id,
        url,
        display_order
      ),
      product_variants(
        id,
        sku,
        price_kes,
        discount_price_kes,
        stock_quantity,
        variant_attributes
      )
    `)
    // Ensure we only show products that have at least one active SKU variant
    .not('product_variants', 'is', null)
    .limit(50);

  if (error) {
    console.error('Error fetching storefront products:', error.message);
  }

  // 2. DATA TRANSFORMATION & SAFETY MATRICES
  // Safely cast the raw relational data into the strict Product interface expected by the UI
  const rawProducts = (productsData as unknown) as SupabaseProductJoin[] || [];
  
  const formattedProducts: Product[] = rawProducts.map((p) => {
    // Supabase sometimes returns 1-to-1 relationships as arrays depending on the schema structure.
    // We safely flatten them to single objects here.
    const categoryObj = Array.isArray(p.category) ? p.category[0] : p.category;
    const collectionObj = Array.isArray(p.collection) ? p.collection[0] : p.collection;

    return {
      id: p.id,
      ref_id: p.ref_id,
      product_type: p.product_type || 'hair',
      description: p.description || undefined,
      base_attributes: p.base_attributes || {},
      category: categoryObj,
      collection: collectionObj,
      images: p.product_images || [],
      variants: p.product_variants.map(v => ({
        id: v.id,
        sku: v.sku,
        stock_quantity: v.stock_quantity,
        variant_attributes: v.variant_attributes,
        // PostgreSQL NUMERIC types sometimes return as strings via the API; ensure they are numbers
        price_kes: Number(v.price_kes),
        discount_price_kes: v.discount_price_kes ? Number(v.discount_price_kes) : null
      })),
    };
  });

  // 3. CATALOG SORTING & UI EXTRACTION
  // Extract a clean string array of category names to build the interactive UI tabs
  const dynamicCategories = Array.from(
    new Set(formattedProducts.map(p => p.category?.name || 'Exclusive Collection'))
  ).filter(Boolean).sort();

  return (
    <div className="flex min-h-screen flex-col bg-background transition-colors duration-500 ease-in-out selection:bg-primary/20">
      
      {/* Silent Cart Listener */}
      <CartAutoOpener />
      
      <HeroSection />
      
      {/* Pass the rigorously typed products matrix into the collection grid.
        All pricing, sale tags, and dynamic taxonomy icons will automatically resolve.
      */}
      <FeaturedCollections 
        products={formattedProducts} 
        categories={dynamicCategories} 
      />
      
      <Footer />
    </div>
  );
}