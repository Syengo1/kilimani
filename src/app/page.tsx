// src/app/page.tsx
import { createClient } from '@/lib/supabase/server';
import HeroSection from '@/components/home/HeroSection';
import FeaturedCollections from '@/components/home/FeaturedCollections';
import Footer from '@/components/layout/Footer';

export default async function HomePage() {
  const supabase = await createClient();

  // Fetch products with their related images, variants, and category names
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
        stock_quantity
      )
    `)
    // Optional: Only fetch products that have active variants/images
    .limit(20); 

  if (error) {
    console.error('Error fetching products:', error);
  }

  // Transform the Supabase relational data to match our ProductCard interface
  const formattedProducts = (productsData || []).map((p: any) => ({
    id: p.id,
    title: p.title,
    base_attributes: p.base_attributes,
    category: p.categories?.name || 'Uncategorized',
    images: p.product_images || [],
    variants: p.product_variants || [],
  }));

  // Dynamically generate the category tabs based on the fetched products
  // 'All Exclusives' is always first
  const dynamicCategories = [
    'All Exclusives',
    ...Array.from(new Set(formattedProducts.map(p => p.category))).filter(c => c !== 'Uncategorized')
  ];

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <HeroSection />
      
      {/* Pass the live data down to the Client Component */}
      <FeaturedCollections 
        products={formattedProducts} 
        categories={dynamicCategories} 
      />
      
      <Footer />
    </main>
  );
}