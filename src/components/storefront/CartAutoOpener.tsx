'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

function AutoOpenerLogic() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (searchParams.get('cart') === 'open') {
      // 1. Give the DOM a tiny fraction of a second to mount the Header before shouting
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('open-cart-drawer'));
      }, 50);

      // 2. Clean the URL cleanly
      router.replace(pathname, { scroll: false });
    }
  }, [searchParams, pathname, router]);

  return null;
}

// Next.js 14 requires useSearchParams to be wrapped in a Suspense boundary
// so it doesn't break server-side rendering.
export default function CartAutoOpener() {
  return (
    <Suspense fallback={null}>
      <AutoOpenerLogic />
    </Suspense>
  );
}