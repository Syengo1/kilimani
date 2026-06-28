'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, MonitorSmartphone, ShoppingBag } from 'lucide-react';
import { AppRole } from '@/app/(admin)/dashboard/layout';

// The Strict RBAC Navigation Matrix (Mobile Version)
const getMobileLinks = (role: AppRole) => {
  const links = [
    { name: 'Home', href: '/dashboard', icon: LayoutDashboard, roles: ['super_admin', 'admin', 'cashier'] },
    { name: 'POS', href: '/dashboard/pos', icon: MonitorSmartphone, roles: ['super_admin', 'admin', 'cashier'] },
    { name: 'Stock', href: '/dashboard/inventory', icon: Package, roles: ['super_admin', 'admin'] },
    { name: 'Orders', href: '/dashboard/orders', icon: ShoppingBag, roles: ['super_admin'] },
    // Analytics & Team are omitted here to keep mobile nav uncluttered.
  ];
  return links.filter(link => link.roles.includes(role));
};

// Now accepts `icon` as a React Element Type so it can instantiate it internally
const MobileNavLink = ({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) => {
  const pathname = usePathname();
  const isActive = href === '/dashboard' ? pathname === href : pathname?.startsWith(href);

  return (
    <Link 
      href={href} 
      onClick={() => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(30);
      }}
      className={`relative flex flex-col items-center justify-center w-full py-3 gap-1 transition-all duration-300 touch-manipulation active:scale-95 ${
        isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      <div className={`p-1.5 rounded-full transition-colors duration-300 ${isActive ? 'bg-primary/10' : ''}`}>
        {/* Stroke width is now managed safely inside the component */}
        <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
      </div>
      <span className="text-[10px] font-bold tracking-wide">{label}</span>
    </Link>
  );
};

export function MobileNav({ userRole }: { userRole: AppRole }) {
  const authorizedLinks = getMobileLinks(userRole);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border flex items-center justify-around px-2 z-50 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1 shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
      {authorizedLinks.map((link) => (
        <MobileNavLink 
          key={link.name} 
          href={link.href} 
          icon={link.icon} 
          label={link.name} 
        />
      ))}
    </nav>
  );
}