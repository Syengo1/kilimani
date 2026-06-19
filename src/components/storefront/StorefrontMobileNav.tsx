'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Sparkles, ShoppingBag, Search } from 'lucide-react';
import { useCart } from './cart/CartContext';

export default function StorefrontMobileNav() {
  const pathname = usePathname();
  const { items, isHydrated } = useCart();

  const cartCount = items.reduce((total, item) => total + item.quantity, 0);

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/collections', label: 'Shop', icon: Sparkles },
    { href: '/search', label: 'Search', icon: Search },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-xl border-t border-border/50 flex items-center justify-around px-4 z-40 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all active:scale-95 ${
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
            <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
          </Link>
        );
      })}

      {/* Mobile Cart Trigger Link */}
      <Link
        href="/cart"
        className={`relative flex flex-col items-center justify-center w-full h-full gap-1 transition-all active:scale-95 ${
          pathname.startsWith('/cart') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <div className="relative">
          <ShoppingBag size={20} strokeWidth={pathname.startsWith('/cart') ? 2 : 1.5} />
          {isHydrated && cartCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-4 h-4 px-1 text-[9px] font-bold text-primary-foreground bg-primary rounded-full ring-2 ring-background">
              {cartCount}
            </span>
          )}
        </div>
        <span className="text-[10px] font-medium tracking-wide">Cart</span>
      </Link>
    </nav>
  );
}