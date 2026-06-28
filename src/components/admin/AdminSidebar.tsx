'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  MonitorSmartphone, 
  Package, 
  ShoppingBag, 
  BarChart3, 
  Users, 
  LogOut, 
  ShieldAlert
} from 'lucide-react';

export type AppRole = 'super_admin' | 'admin' | 'cashier';

interface AdminSidebarProps {
  userRole: AppRole;
  userName: string;
}

export default function AdminSidebar({ userRole, userName }: AdminSidebarProps) {
  const pathname = usePathname();

  // THE RBAC NAVIGATION MATRIX
  // We mathematically define which roles have clearance for which routes
  const navigation = [
    {
      name: 'POS Terminal',
      href: '/admin/pos',
      icon: MonitorSmartphone,
      allowedRoles: ['super_admin', 'admin', 'cashier'],
    },
    {
      name: 'Inventory',
      href: '/admin/inventory',
      icon: Package,
      allowedRoles: ['super_admin', 'admin'],
    },
    {
      name: 'Order Fulfillment',
      href: '/admin/orders',
      icon: ShoppingBag,
      allowedRoles: ['super_admin'],
    },
    {
      name: 'Sales & Analytics',
      href: '/admin/sales',
      icon: BarChart3,
      allowedRoles: ['super_admin'],
    },
    {
      name: 'Team Management',
      href: '/admin/team',
      icon: Users,
      allowedRoles: ['super_admin'],
    },
  ];

  // Filter the navigation array based strictly on the user's role clearance
  const authorizedLinks = navigation.filter(link => 
    link.allowedRoles.includes(userRole)
  );

  return (
    <aside className="w-64 h-[100dvh] bg-stone-950 text-stone-300 flex flex-col border-r border-stone-800 shrink-0">
      
      {/* Branding & Role Badge */}
      <div className="p-6 border-b border-stone-800 bg-stone-950 z-10">
        <h2 className="text-xl font-serif font-bold text-white tracking-wide">Kilimani Hair</h2>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-mono uppercase tracking-widest text-emerald-500/90 font-semibold">
            {userRole.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Authorized Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 custom-scrollbar">
        {authorizedLinks.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                isActive 
                  ? 'bg-primary text-primary-foreground shadow-md' 
                  : 'hover:bg-stone-900 hover:text-white'
              }`}
            >
              <Icon 
                size={18} 
                className={isActive ? 'text-primary-foreground' : 'text-stone-500 group-hover:text-stone-300'} 
                strokeWidth={isActive ? 2.5 : 2}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-stone-800 bg-stone-900/50">
        <div className="flex items-center justify-between px-2 py-2">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white">{userName}</span>
            <span className="text-xs text-stone-500 font-medium truncate w-32">
              ID Badge Active
            </span>
          </div>
          <button 
            className="p-2.5 rounded-lg bg-stone-800 hover:bg-destructive hover:text-destructive-foreground transition-colors text-stone-400 group"
            aria-label="Secure Logout"
          >
            <LogOut size={16} strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
      
    </aside>
  );
}