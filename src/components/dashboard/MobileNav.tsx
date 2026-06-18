'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, BarChart3, Package } from 'lucide-react';

// 1. FIXED: Extract MobileNavLink outside the main component.
// It manages its own routing state internally, preventing expensive re-renders.
const MobileNavLink = ({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) => {
  const pathname = usePathname();
  
  // Exact match for the root dashboard, partial match for deep links (e.g., /dashboard/inventory/edit)
  const isActive = href === '/dashboard' ? pathname === href : pathname?.startsWith(href);

  return (
    <Link 
      href={href} 
      className={`relative flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300 ${
        isActive ? 'text-primary' : 'text-foreground/40 hover:text-foreground/70'
      }`}
    >
      <div className={`transition-transform duration-300 ${isActive ? '-translate-y-0.5' : ''}`}>
        {icon}
      </div>
      <span className="text-[10px] font-medium tracking-wide">{label}</span>
      
      {/* Active Indicator Dot - Absolute positioned to prevent UI jitter when appearing */}
      <div 
        className={`absolute bottom-1 w-1 h-1 rounded-full bg-primary transition-all duration-300 ${
          isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
        }`} 
      />
    </Link>
  );
};

export function MobileNav({ isAdmin }: { isAdmin: boolean }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background/90 backdrop-blur-xl border-t border-border flex items-center justify-around px-2 z-50 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
      <MobileNavLink href="/dashboard" icon={<LayoutDashboard size={20} />} label="Home" />
      <MobileNavLink href="/dashboard/inventory" icon={<Package size={20} />} label="Stock" />
      
      {isAdmin && (
        <>
          <MobileNavLink href="/dashboard/analytics" icon={<BarChart3 size={20} />} label="Data" />
          <MobileNavLink href="/dashboard/staff" icon={<Users size={20} />} label="Team" />
        </>
      )}
    </nav>
  );
}