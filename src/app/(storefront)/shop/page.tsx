import { fetchShopProducts } from '@/app/actions/shop';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { ShopFilterSidebar } from '@/components/shop/ShopFilterSidebar';
import { ProductGrid } from '@/components/shop/ProductGrid';

export const dynamic = 'force-dynamic';

// FIX 1: Type searchParams as a Promise to comply with Next.js 15+ 
export default async function ShopPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // FIX 2: Await the Promise before accessing its properties
  const searchParams = await props.searchParams;

  const params = {
    category: typeof searchParams.category === 'string' ? searchParams.category : 'all',
    sort: (typeof searchParams.sort === 'string' ? searchParams.sort : 'newest') as 'newest' | 'price_asc' | 'price_desc',
    search: typeof searchParams.search === 'string' ? searchParams.search : undefined,
  };

  const products = await fetchShopProducts(params);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 animate-in fade-in duration-500">
      
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-serif font-black tracking-tight text-foreground">
          The Collection
        </h1>
        <p className="text-muted-foreground mt-3 max-w-xl text-sm md:text-base">
          Discover our premium selection of HD lace wigs, extensions, and hair care products. Uncompromising quality for the modern aesthetic.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        <aside className="w-full lg:w-64 shrink-0 lg:sticky lg:top-24 z-10">
          <ShopFilterSidebar />
        </aside>

        <main className="flex-1 w-full min-w-0">
          <Suspense 
            fallback={
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="aspect-[4/5] bg-foreground/5 animate-pulse rounded-2xl" />
                ))}
              </div>
            }
          >
            <ProductGrid products={products} />
          </Suspense>
        </main>

      </div>
    </div>
  );
}