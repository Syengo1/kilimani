'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';

function AutoOpenerLogic() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (searchParams?.get('cart') === 'open') {
      // Trigger your cart state/drawer here
      window.dispatchEvent(new CustomEvent('open-cart-drawer'));

      // Clean the URL so refreshing doesn't keep forcing it open
      const params = new URLSearchParams(searchParams.toString());
      params.delete('cart');
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [searchParams, pathname, router]);

  return null; // This is a logic-only component, it renders nothing
}

// Export wrapped in Suspense to prevent Next.js build crash
export default function CartAutoOpener() {
  return (
    <Suspense fallback={null}>
      <AutoOpenerLogic />
    </Suspense>
  );
}