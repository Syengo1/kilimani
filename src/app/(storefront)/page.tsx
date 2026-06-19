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

  // 1. DATA FETCHING
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

  // 2. DATA TRANSFORMATION & SAFETY
  const rawProducts = (productsData as unknown) as SupabaseProductJoin[] || [];
  
  const formattedProducts: (Product & { category: string })[] = rawProducts.map((p) => {
    const categoryName = Array.isArray(p.categories) 
      ? p.categories[0]?.name 
      : p.categories?.name;

    return {
      id: p.id,
      title: p.title,
      base_attributes: p.base_attributes || {},
      category: categoryName || 'Premium Collection', // Ironclad fallback
      images: p.product_images || [],
      variants: p.product_variants || [],
    };
  });

  // 3. CATALOG SORTING
  // Extracts unique categories and sorts them alphabetically for a consistent UX
  const dynamicCategories = Array.from(
    new Set(formattedProducts.map(p => p.category))
  ).filter(Boolean).sort();

  return (
    // 4. THEME FLUIDITY: transition-colors duration-500 eases background shifts
    <div className="flex min-h-screen flex-col bg-background transition-colors duration-500 ease-in-out selection:bg-primary/20">
      
      <HeroSection />
      
      <FeaturedCollections 
        products={formattedProducts} 
        categories={dynamicCategories} 
      />
      
      {/* <Footer /> */}
    </div>
  );
}