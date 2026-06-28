'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, BarChart3, Package, Settings, LogOut, Loader2, MonitorSmartphone, ShoppingBag } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { createClient } from '@/lib/supabase/client';
import { AppRole } from '@/app/(admin)/dashboard/layout';

// The Strict RBAC Navigation Matrix
const getNavigationLinks = (role: AppRole) => {
  const links = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard, roles: ['super_admin', 'admin', 'cashier'] },
    { name: 'POS Terminal', href: '/dashboard/pos', icon: MonitorSmartphone, roles: ['super_admin', 'admin', 'cashier'] },
    { name: 'Inventory', href: '/dashboard/inventory', icon: Package, roles: ['super_admin', 'admin'] },
    { name: 'Orders', href: '/dashboard/orders', icon: ShoppingBag, roles: ['super_admin'] },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, roles: ['super_admin'] },
    { name: 'Staff Team', href: '/dashboard/staff', icon: Users, roles: ['super_admin'] },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings, roles: ['super_admin'] },
  ];
  return links.filter(link => link.roles.includes(role));
};

const NavLink = ({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) => {
  const pathname = usePathname();
  const isActive = href === '/dashboard' ? pathname === href : pathname?.startsWith(href);

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 group ${
        isActive
          ? 'bg-primary text-primary-foreground shadow-md scale-[0.98]'
          : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'
      }`}
    >
      <span className={isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground transition-colors'}>
        {icon}
      </span>
      {label}
    </Link>
  );
};

export function DesktopNav({ userRole, userName }: { userRole: AppRole; userName: string }) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const authorizedLinks = getNavigationLinks(userRole);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      setIsSigningOut(false);
    }
  };

  return (
    <aside className="hidden md:flex w-64 lg:w-72 bg-background border-r border-border/60 flex-col h-screen sticky top-0 shadow-2xl z-50">
      {/* Brand Header */}
      <div className="p-6 h-20 flex items-center justify-between border-b border-border/50 shrink-0 bg-background/95 backdrop-blur-md">
        <h1 className="text-2xl font-serif font-black tracking-tight text-foreground">Kilimani.</h1>
        <ThemeToggle />
      </div>

      {/* Authorized Navigation */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        <div className="mb-6 px-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Workspace</p>
        </div>
        {authorizedLinks.map((link) => (
          <NavLink key={link.name} href={link.href} icon={<link.icon size={18} strokeWidth={2.5} />} label={link.name} />
        ))}
      </nav>

      {/* Secure Footer Profile / Logout */}
      <div className="p-4 border-t border-border/50 shrink-0 bg-foreground/[0.02]">
        <div className="px-4 py-3 mb-2">
          <p className="text-sm font-bold text-foreground truncate">{userName}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-500 font-bold uppercase tracking-widest">
              {userRole.replace('_', ' ')}
            </p>
          </div>
        </div>
        <button 
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-destructive/80 hover:bg-destructive/10 hover:text-destructive transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSigningOut ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <LogOut size={18} strokeWidth={2.5} className="group-hover:-translate-x-1 transition-transform" />
          )}
          {isSigningOut ? 'Terminating...' : 'Secure Logout'}
        </button>
      </div>
    </aside>
  );
}