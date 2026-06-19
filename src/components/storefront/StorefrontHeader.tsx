'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';
import { ThemeToggle } from '@/components/dashboard/ThemeToggle';
import StorefrontSearch from './StorefrontSearch';
import { useCart } from './cart/CartContext';
import CartDrawer from './cart/CartDrawer';

export default function StorefrontHeader() {
  const pathname = usePathname();
  const { items, isHydrated } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Advanced Scroll-Aware State
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  
  const cartItemCount = items.reduce((total, item) => total + item.quantity, 0);

  const links = [
    { href: '/', label: 'Home' },
    { href: '/collections', label: 'All Collections' },
    { href: '/about', label: 'Our Story' },
  ];

  // High-Performance Scroll Tracker
  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // 1. Determine if we are at the top of the page
      if (currentScrollY < 50) {
        setIsScrolled(false);
        setIsHidden(false);
      } else {
        setIsScrolled(true);
        // 2. Hide if scrolling down (and past the 100px threshold), Show if scrolling up
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          setIsHidden(true);
        } else {
          setIsHidden(false);
        }
      }
      
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${
          isHidden ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'
        } ${
          isScrolled 
            ? 'h-16 md:h-20 bg-background/90 backdrop-blur-xl border-b border-border/50 shadow-sm' 
            : 'h-20 md:h-24 bg-gradient-to-b from-background/80 via-background/40 to-transparent border-transparent'
        }`}
      >
        <div className="max-w-[1600px] mx-auto h-full px-4 md:px-8 flex items-center justify-between">
          
          {/* Left: Identity */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-serif font-bold text-sm shadow-lg group-active:scale-95 transition-transform">
                K
              </div>
              <span className="text-lg md:text-xl font-serif font-bold tracking-wide text-foreground">
                Kilimani
              </span>
            </Link>

            {/* Center-Left Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-6">
              {links.map((link) => {
                const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm font-medium tracking-wide transition-colors relative py-2 ${
                      isActive ? 'text-foreground' : 'text-foreground/70 hover:text-foreground'
                    }`}
                  >
                    {link.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Actions Block */}
          <div className="flex items-center gap-1 md:gap-3 flex-1 justify-end">
            <StorefrontSearch />
            <div className="h-5 w-[1px] bg-border/50 mx-1 md:mx-2 hidden sm:block" />
            <ThemeToggle />

            {/* Desktop Cart Button */}
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 rounded-full hover:bg-foreground/10 text-foreground/80 hover:text-foreground transition-all active:scale-95 focus:outline-none shrink-0 ml-1 hidden md:flex items-center justify-center"
              aria-label="Open Cart"
            >
              <ShoppingBag size={22} strokeWidth={1.5} />
              {isHydrated && cartItemCount > 0 && (
                <span className="absolute top-1 right-1 translate-x-1/4 -translate-y-1/4 flex items-center justify-center min-w-4 h-4 px-1 text-[9px] font-bold text-primary-foreground bg-primary rounded-full shadow-md animate-in zoom-in duration-300">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* The Cart Drawer overlay */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}