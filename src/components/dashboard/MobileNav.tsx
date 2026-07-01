'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, MonitorSmartphone, ShoppingBag, Menu, BarChart3, Users, Settings, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppRole } from '@/app/(admin)/dashboard/layout';

// ==========================================
// STRICT RBAC MATRICES
// ==========================================
const getPrimaryLinks = (role: AppRole) => {
  const links = [
    { name: 'POS', href: '/dashboard/pos', icon: MonitorSmartphone, roles: ['super_admin', 'admin', 'cashier'] },
    { name: 'Home', href: '/dashboard', icon: LayoutDashboard, roles: ['super_admin', 'admin', 'cashier'] },
    { name: 'Stock', href: '/dashboard/inventory', icon: Package, roles: ['super_admin', 'admin'] },
    { name: 'Orders', href: '/dashboard/orders', icon: ShoppingBag, roles: ['super_admin'] },
  ];
  return links.filter(link => link.roles.includes(role));
};

const getSecondaryLinks = (role: AppRole) => {
  const links = [
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, roles: ['super_admin'] },
    { name: 'Staff Team', href: '/dashboard/staff', icon: Users, roles: ['super_admin'] },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings, roles: ['super_admin'] },
  ];
  return links.filter(link => link.roles.includes(role));
};

// ==========================================
// PRIMARY NAV BUTTON COMPONENT
// ==========================================
const MobileNavLink = ({ href, icon: Icon, label, isActive, onClick }: { href?: string; icon: React.ElementType; label: string; isActive: boolean; onClick?: () => void }) => {
  const innerContent = (
    <>
      <div className={`p-1.5 rounded-full transition-colors duration-300 ${isActive ? 'bg-primary/10' : ''}`}>
        <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
      </div>
      <span className="text-[10px] font-bold tracking-wide">{label}</span>
    </>
  );

  const className = `relative flex flex-col items-center justify-center w-full py-3 gap-1 transition-all duration-300 touch-manipulation active:scale-95 ${
    isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
  }`;

  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(30);
    if (onClick) onClick();
  };

  if (href) {
    return (
      <Link href={href} onClick={triggerHaptic} className={className}>
        {innerContent}
      </Link>
    );
  }

  return (
    <button onClick={triggerHaptic} className={className}>
      {innerContent}
    </button>
  );
};

// ==========================================
// MAIN MOBILE NAV
// ==========================================
export function MobileNav({ userRole }: { userRole: AppRole }) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const primaryLinks = getPrimaryLinks(userRole);
  const secondaryLinks = getSecondaryLinks(userRole);

  // If the user is on a secondary page (e.g. Settings), the Menu icon should light up
  const isMenuIconActive = secondaryLinks.some(link => pathname?.startsWith(link.href));

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMenuOpen]);

  const closeMenu = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(20);
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* 1. BOTTOM TAB BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border flex items-center justify-around px-2 z-50 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1 shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
        
        {/* HAMBURGER MENU (Placed far left, conditionally rendered based on RBAC) */}
        {secondaryLinks.length > 0 && (
          <MobileNavLink 
            icon={Menu} 
            label="More" 
            isActive={isMenuIconActive || isMenuOpen} 
            onClick={() => setIsMenuOpen(true)} 
          />
        )}

        {/* PRIMARY LINKS */}
        {primaryLinks.map((link) => {
          const isActive = link.href === '/dashboard' ? pathname === link.href : pathname?.startsWith(link.href);
          return (
            <MobileNavLink 
              key={link.name} 
              href={link.href} 
              icon={link.icon} 
              label={link.name} 
              isActive={isActive}
            />
          );
        })}
      </nav>

      {/* 2. THE SLIDE-UP DRAWER (BOTTOM SHEET) */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Dark Backdrop Overlay */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeMenu}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60] md:hidden"
            />
            
            {/* Bottom Sheet Container */}
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed bottom-0 left-0 right-0 bg-background border-t border-border/50 rounded-t-3xl shadow-2xl z-[70] flex flex-col md:hidden pb-[max(env(safe-area-inset-bottom),1.5rem)]"
            >
              {/* Drawer Drag Handle / Header */}
              <div className="flex items-center justify-between p-5 border-b border-border/50">
                <h3 className="font-serif font-black tracking-tight text-lg text-foreground">Menu</h3>
                <button 
                  onClick={closeMenu} 
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-foreground/5 hover:bg-foreground/10 text-muted-foreground transition-colors active:scale-95"
                >
                  <X size={20} strokeWidth={2.5} />
                </button>
              </div>

              {/* Secondary Navigation Links */}
              <div className="p-3 space-y-1">
                {secondaryLinks.map((link) => {
                  const isActive = pathname?.startsWith(link.href);
                  const Icon = link.icon;

                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={closeMenu}
                      className={`flex items-center justify-between p-4 rounded-2xl transition-all active:scale-[0.98] ${
                        isActive 
                          ? 'bg-primary text-primary-foreground shadow-md' 
                          : 'bg-background hover:bg-foreground/5 text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 flex items-center justify-center rounded-xl ${isActive ? 'bg-background/20' : 'bg-foreground/5 text-muted-foreground'}`}>
                          <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                        </div>
                        <span className="font-bold text-sm">{link.name}</span>
                      </div>
                      <ChevronRight size={18} className={isActive ? 'text-primary-foreground/50' : 'text-muted-foreground/50'} />
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}