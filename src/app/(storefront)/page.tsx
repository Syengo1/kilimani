import { createClient } from '@/lib/supabase/server';
import HeroSection from '@/components/home/HeroSection';
import FeaturedCollections from '@/components/home/FeaturedCollections';
// import Footer from '@/components/layout/Footer';
import { Product } from '@/components/storefront/ProductCard';

export const revalidate = 60;

type SupabaseProductJoin = {
  id: string;
  title: string;
  base_attributes: { isNew?: boolean; label?: string } | null;
  // 1. FIX: Support both array and object returns depending on Supabase relationship mapping
  categories: { name: string } | { name: string }[] | null;
  product_images: { id: string; url: string; display_order: number }[];
  product_variants: { 
    id: string; 
    price_kes: number | string; 
    stock_quantity: number; 
    variant_attributes: Record<string, unknown> 
  }[];
};

export default async function HomePage() {
  const supabase = await createClient();

  const { data: productsData, error } = await supabase
    .from('products')
    .select(`
      id,
      title,
      base_attributes,
      categories (
        name
      ),
      product_images (
        id,
        url,
        display_order
      ),
      product_variants (
        id,
        price_kes,
        stock_quantity,
        variant_attributes
      )
    `)
    .not('product_variants', 'is', null)
    .limit(50);

  if (error) {
    console.error('Error fetching storefront products:', error.message);
  }

  // 2. FIX: Explicitly type the result as Product intersected with a REQUIRED category string.
  // We use `as unknown as` to bypass Supabase's strict inferred type constraints cleanly.
  const formattedProducts: (Product & { category: string })[] = 
    ((productsData as unknown) as SupabaseProductJoin[] || []).map((p) => {
      
      // Safely extract the category name whether Supabase returned an array or a single object
      const categoryName = Array.isArray(p.categories) 
        ? p.categories[0]?.name 
        : p.categories?.name;

      return {
        id: p.id,
        title: p.title,
        base_attributes: p.base_attributes || {},
        category: categoryName || 'Premium Collection', // Guaranteed fallback
        images: p.product_images || [],
        variants: p.product_variants || [],
      };
    });

  // Extract unique categories based strictly on the processed data
  const dynamicCategories = Array.from(
    new Set(formattedProducts.map(p => p.category))
  ).filter(Boolean);

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/20">
      
      <HeroSection />
      
      <FeaturedCollections 
        products={formattedProducts} 
        categories={dynamicCategories} 
      />
      
      {/* <Footer /> */}
    </div>
  );
}