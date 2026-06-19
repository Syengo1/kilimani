'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Sparkles, ShoppingBag, Search } from 'lucide-react';
import { useCart } from './cart/CartContext';
import CartDrawer from './cart/CartDrawer';

export default function StorefrontMobileNav() {
  const pathname = usePathname();
  const { items, isHydrated } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Safely calculate total items
  const cartCount = items.reduce((total, item) => total + item.quantity, 0);

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/collections', label: 'Shop', icon: Sparkles },
    { href: '/search', label: 'Search', icon: Search },
  ];

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-xl border-t border-border/50 flex items-center justify-around px-2 z-40 pt-1 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
        {navItems.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center w-full py-2.5 gap-1 transition-all active:scale-95 group"
              aria-label={item.label}
            >
              {/* Active State Icon Pill */}
              <div className={`relative p-1.5 rounded-full transition-colors duration-300 ${
                isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground group-hover:text-foreground'
              }`}>
                <Icon size={22} strokeWidth={isActive ? 2 : 1.5} />
              </div>
              
              <span className={`text-[10px] font-semibold tracking-wide transition-colors duration-300 ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Mobile Cart Trigger Button */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative flex flex-col items-center justify-center w-full py-2.5 gap-1 transition-all active:scale-95 group"
          aria-label="Open Cart"
        >
          <div className={`relative p-1.5 rounded-full transition-colors duration-300 ${
            isCartOpen ? 'bg-primary/10 text-primary' : 'text-muted-foreground group-hover:text-foreground'
          }`}>
            <ShoppingBag size={22} strokeWidth={isCartOpen ? 2 : 1.5} />
            
            {/* Dynamic Notification Badge with Ring Punch-Out */}
            {isHydrated && cartCount > 0 && (
              <span className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-primary-foreground bg-primary rounded-full ring-2 ring-background shadow-sm animate-in zoom-in duration-300">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </div>
          
          <span className={`text-[10px] font-semibold tracking-wide transition-colors duration-300 ${
            isCartOpen ? 'text-primary' : 'text-muted-foreground'
          }`}>
            Cart
          </span>
        </button>
      </nav>

      {/* Mount the Drawer Component for Mobile */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}