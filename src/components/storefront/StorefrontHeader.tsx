'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';
import { ThemeToggle } from '@/components/dashboard/ThemeToggle';
import StorefrontSearch from './StorefrontSearch';
import { useCart } from './cart/CartContext';

export default function StorefrontHeader() {
  const pathname = usePathname();
  const { items, isHydrated } = useCart();
  
  const cartItemCount = items.reduce((total, item) => total + item.quantity, 0);

  const links = [
    { href: '/', label: 'Home' },
    { href: '/collections', label: 'All Collections' },
    { href: '/about', label: 'Our Story' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 h-16 md:h-20 bg-background/80 backdrop-blur-xl border-b border-border/50 z-40 transition-all duration-300">
      <div className="max-w-[1600px] mx-auto h-full px-4 md:px-8 flex items-center justify-between">
        
        {/* Left: Identity */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-serif font-bold text-sm shadow-lg group-active:scale-95 transition-transform">
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
                    isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Actions Block */}
        <div className="flex items-center gap-1 md:gap-3 flex-1 justify-end">
          <StorefrontSearch />
          <div className="h-5 w-[1px] bg-border mx-1 md:mx-2 hidden sm:block" />
          <ThemeToggle />

          {/* Desktop Only Cart Button */}
          <Link 
            href="/cart"
            className="relative p-2 rounded-full hover:bg-foreground/10 text-foreground/80 hover:text-foreground transition-all active:scale-95 focus:outline-none shrink-0 ml-1"
            aria-label="Open Cart"
          >
            <ShoppingBag size={22} strokeWidth={1.5} />
            {isHydrated && cartItemCount > 0 && (
              <span className="absolute top-1.5 right-1.5 translate-x-1/2 -translate-y-1/2 flex items-center justify-center min-w-4 h-4 px-1 text-[9px] font-bold text-primary-foreground bg-primary rounded-full shadow-sm">
                {cartItemCount}
              </span>
            )}
          </Link>
        </div>

      </div>
    </header>
  );
}