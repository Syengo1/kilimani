'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { ShoppingBag } from 'lucide-react'; // Menu icon removed
import { ThemeToggle } from '@/components/dashboard/ThemeToggle';
import StorefrontSearch from './StorefrontSearch';
import { useCart } from './cart/CartContext';
import CartDrawer from './cart/CartDrawer';

// ============================================================================
// MICRO-LISTENER: Safely catches the ?cart=open URL parameter
// ============================================================================
function CartQueryListener({ openCart }: { openCart: () => void }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (searchParams.get('cart') === 'open') {
      openCart();
      router.replace(pathname, { scroll: false });
    }
  }, [searchParams, pathname, router, openCart]);

  return null;
}

export default function StorefrontHeader() {
  const pathname = usePathname();
  const { items, isHydrated } = useCart();
  
  // SINGLE SOURCE OF TRUTH: The Header owns the drawer state
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Advanced Scroll-Aware State for Apple-Tier Header Animation
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  
  const cartItemCount = items.reduce((total, item) => total + item.quantity, 0);

  const links = [
    { href: '/', label: 'Home' },
    { href: '/collections', label: 'All Collections' },
    { href: '/about', label: 'Our Story' },
  ];

  // EVENT BRIDGE: Listens for the mobile nav remote control
  useEffect(() => {
    const handleOpenCart = () => setIsCartOpen(true);
    window.addEventListener('open-cart-drawer', handleOpenCart);
    return () => window.removeEventListener('open-cart-drawer', handleOpenCart);
  }, []);

  // HIGH-PERFORMANCE SCROLL TRACKER
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          
          // Apply blur/border when scrolled past 20px
          setIsScrolled(currentScrollY > 20);
          
          // Hide header on scroll down to save screen real estate, show instantly on scroll up
          if (currentScrollY > lastScrollY && currentScrollY > 100) {
            setIsHidden(true);
          } else {
            setIsHidden(false);
          }
          
          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <CartQueryListener openCart={() => setIsCartOpen(true)} />
      </Suspense>

      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ease-in-out ${
          isHidden ? '-translate-y-full' : 'translate-y-0'
        } ${
          isScrolled 
            ? 'bg-background/85 backdrop-blur-lg border-b border-border/40 shadow-sm' 
            : 'bg-transparent border-b-transparent' // PERFECT BLEND: Transparent at the top
        }`}
      >
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          
          {/* FAR LEFT: Business Name / Logo */}
          <div className="flex-1 flex justify-start">
            <Link 
              href="/" 
              className="text-xl md:text-2xl font-serif font-bold tracking-tight text-foreground hover:opacity-80 transition-opacity"
            >
              Kilimani Hair
            </Link>
          </div>

          {/* CENTER: Desktop Navigation (Hidden on Mobile) */}
          <div className="hidden md:flex items-center justify-center">
            <nav className="flex items-center gap-8">
              {links.map((link) => {
                const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative text-sm font-medium transition-colors hover:text-foreground py-2 ${
                      isActive ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {link.label}
                    {isActive && (
                      <span className="absolute left-0 bottom-0 w-full h-[2px] bg-foreground rounded-full animate-in fade-in duration-300" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* FAR RIGHT: Search, Theme Toggle, & Desktop Cart */}
          <div className="flex-1 flex items-center justify-end gap-1.5 sm:gap-2 md:gap-3">
            
            {/* Search Icon (Now perfectly next to Theme Toggle on all devices) */}
            <StorefrontSearch />
            
            <div className="h-4 w-[1px] bg-border/60 mx-1" />
            
            <ThemeToggle />

            {/* Desktop Cart Button (Strictly hidden on mobile) */}
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 rounded-full hover:bg-foreground/10 text-foreground/80 hover:text-foreground transition-all active:scale-95 focus:outline-none shrink-0 ml-1 hidden md:flex items-center justify-center"
              aria-label="Open Cart"
            >
              <ShoppingBag size={22} strokeWidth={1.5} />
              
              {isHydrated && cartItemCount > 0 && (
                <span className="absolute top-1 right-1 translate-x-1/4 -translate-y-1/4 flex items-center justify-center min-w-[18px] h-[18px] px-1.5 text-[10px] font-bold text-background bg-foreground rounded-full shadow-md animate-in zoom-in duration-300">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* The ONLY instance of the Drawer in the entire application */}
      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
      />
    </>
  );
}