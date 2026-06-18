'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, BarChart3, Package, Settings, LogOut, Loader2 } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { createClient } from '@/lib/supabase/client';

// 1. FIXED: Extract NavLink outside the main component.
// It now manages its own routing state, preventing unnecessary re-renders.
const NavLink = ({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) => {
  const pathname = usePathname();
  
  // Exact match for dashboard root, partial match for sub-routes (e.g., /dashboard/inventory/new)
  const isActive = href === '/dashboard' ? pathname === href : pathname?.startsWith(href);

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
        isActive
          ? 'bg-primary/10 text-primary shadow-sm'
          : 'text-foreground/60 hover:bg-foreground/5 hover:text-foreground'
      }`}
    >
      <span className={isActive ? 'text-primary' : 'text-foreground/40 group-hover:text-foreground/70 transition-colors'}>
        {icon}
      </span>
      {label}
    </Link>
  );
};

export function DesktopNav({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  // 2. ROBUSTNESS: Added an asynchronous loading lock to prevent multi-clicks
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
    <aside className="hidden md:flex w-64 lg:w-72 border-r border-border bg-card/30 backdrop-blur-xl flex-col h-screen sticky top-0 transition-all">
      {/* Brand Header */}
      <div className="p-6 h-20 flex items-center justify-between border-b border-border/50 shrink-0">
        <h1 className="text-xl font-serif font-bold tracking-wide text-foreground">Kilimani</h1>
        <ThemeToggle />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
        <NavLink href="/dashboard" icon={<LayoutDashboard size={20} />} label="Overview" />
        <NavLink href="/dashboard/inventory" icon={<Package size={20} />} label="Inventory" />
        
        {isAdmin && (
          <>
            <div className="pt-4 pb-2 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Admin Controls
            </div>
            <NavLink href="/dashboard/analytics" icon={<BarChart3 size={20} />} label="Analytics" />
            <NavLink href="/dashboard/staff" icon={<Users size={20} />} label="Staff Team" />
            <NavLink href="/dashboard/settings" icon={<Settings size={20} />} label="Settings" />
          </>
        )}
      </nav>

      {/* Footer Profile / Logout */}
      <div className="p-4 border-t border-border/50 shrink-0">
        <button 
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500/80 hover:bg-red-500/10 hover:text-red-500 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSigningOut ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
          )}
          {isSigningOut ? 'Terminating...' : 'Terminate Session'}
        </button>
      </div>
    </aside>
  );
}