'use client';

import React, { useMemo, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Home, Sparkles, ShoppingBag, Search } from 'lucide-react';
import { useCart } from './cart/CartContext';

// 1. Move the core logic into an internal component
function MobileNavContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { items, isHydrated } = useCart();

  const cartCount = useMemo(() => {
    return items.reduce((total, item) => total + item.quantity, 0);
  }, [items]);

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/shop', label: 'Shop', icon: Sparkles },
    { href: '/search', label: 'Search', icon: Search },
  ];

  const cartUrl = useMemo(() => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('cart', 'open');
    return `${pathname}?${params.toString()}`;
  }, [pathname, searchParams]);

  const isCartActive = searchParams?.get('cart') === 'open';

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border/50 flex items-center justify-around px-2 z-40 pt-1 pb-[max(env(safe-area-inset-bottom),0.5rem)] shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
      {navItems.map((item) => {
        const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        const Icon = item.icon;
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className="relative flex flex-col items-center justify-center w-full py-3 gap-1 transition-all active:scale-95 group"
          >
            <div className={`relative p-1.5 rounded-full transition-colors duration-300 ${
              isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground group-hover:text-foreground'
            }`}>
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
            </div>
            <span className={`text-[10px] font-semibold tracking-wide transition-colors duration-300 ${
              isActive ? 'text-primary' : 'text-muted-foreground'
            }`}>
              {item.label}
            </span>
          </Link>
        );
      })}

      <Link
        href={cartUrl}
        scroll={false}
        className="relative flex flex-col items-center justify-center w-full py-3 gap-1 transition-all active:scale-95 group"
        aria-label="Open Cart"
        onClick={() => {
           if (typeof navigator !== 'undefined' && navigator.vibrate) {
             navigator.vibrate(50);
           }
        }}
      >
        <div className={`relative p-1.5 rounded-full transition-colors duration-300 ${
          isCartActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground group-hover:text-foreground'
        }`}>
          <ShoppingBag size={22} strokeWidth={isCartActive ? 2.5 : 1.5} />
          
          {isHydrated && cartCount > 0 && (
            <span className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-primary-foreground bg-primary rounded-full ring-2 ring-background shadow-sm animate-in zoom-in duration-300">
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          )}
        </div>
        
        <span className={`text-[10px] font-semibold tracking-wide transition-colors duration-300 ${
          isCartActive ? 'text-primary' : 'text-muted-foreground'
        }`}>
          Cart
        </span>
      </Link>
    </nav>
  );
}

// 2. Export the component wrapped in a Suspense boundary
export default function StorefrontMobileNav() {
  return (
    <Suspense fallback={<div className="md:hidden fixed bottom-0 left-0 right-0 h-[60px] bg-background/95 border-t border-border/50 z-40 pb-[max(env(safe-area-inset-bottom),0.5rem)]" />}>
      <MobileNavContent />
    </Suspense>
  );
}