import { ReactNode } from 'react'
import Link from 'next/link'
import { LayoutDashboard, Users, BarChart3, Package, Settings, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: profile } = await supabase
    .from('staff_profiles')
    .select('role, full_name')
    .eq('id', user?.id)
    .single()

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden selection:bg-primary/20">
      {/* Desktop Sidebar (Hidden on Mobile) */}
      <aside className="hidden md:flex w-64 lg:w-72 border-r border-card bg-card/30 backdrop-blur-xl flex-col transition-all">
        <div className="p-6 h-20 flex items-center border-b border-card/60">
          <h1 className="text-xl font-bold tracking-wide text-primary">Kilimani Hair</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          <NavLink href="/dashboard" icon={<LayoutDashboard size={18} />} label="Overview" />
          <NavLink href="/dashboard/inventory" icon={<Package size={18} />} label="Inventory" />
          
          {isAdmin && (
            <>
              <div className="pt-4 pb-2 px-3 text-[10px] font-semibold text-foreground/40 uppercase tracking-wider">Management</div>
              <NavLink href="/dashboard/analytics" icon={<BarChart3 size={18} />} label="Analytics" />
              <NavLink href="/dashboard/staff" icon={<Users size={18} />} label="Staff Network" />
            </>
          )}
        </nav>

        <div className="p-4 border-t border-card/60 bg-card/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="shrink-0 w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-semibold shadow-inner">
                {profile?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="truncate">
                <p className="text-sm font-medium truncate">{profile?.full_name}</p>
                <p className="text-xs text-foreground/50 capitalize truncate">{profile?.role}</p>
              </div>
            </div>
            <button className="p-2 text-foreground/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative">
        <header className="h-16 md:h-20 border-b border-card/60 flex items-center justify-between px-4 md:px-8 bg-background/80 backdrop-blur-md z-10 shrink-0">
          <h2 className="text-base md:text-lg font-medium text-foreground/90">Dashboard Control Panel</h2>
          <button className="p-2 hover:bg-card/80 rounded-full transition-all active:scale-95 focus:ring-2 focus:ring-primary/20">
            <Settings size={20} className="text-foreground/60 hover:text-primary transition-colors" />
          </button>
        </header>
        
        {/* pb-24 ensures content isn't hidden behind the mobile bottom nav */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 md:p-8 pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation (Hidden on Desktop) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background/90 backdrop-blur-xl border-t border-card flex items-center justify-around px-2 z-50 pb-safe">
        <MobileNavLink href="/dashboard" icon={<LayoutDashboard size={20} />} label="Home" />
        <MobileNavLink href="/dashboard/inventory" icon={<Package size={20} />} label="Stock" />
        {isAdmin && (
          <>
            <MobileNavLink href="/dashboard/analytics" icon={<BarChart3 size={20} />} label="Data" />
            <MobileNavLink href="/dashboard/staff" icon={<Users size={20} />} label="Team" />
          </>
        )}
      </nav>
    </div>
  )
}

function NavLink({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <Link 
      href={href} 
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/10 hover:text-primary transition-all group active:scale-[0.98]"
    >
      <span className="text-foreground/40 group-hover:text-primary transition-colors">{icon}</span>
      {label}
    </Link>
  )
}

function MobileNavLink({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <Link href={href} className="flex flex-col items-center justify-center gap-1 w-16 h-full text-foreground/40 hover:text-primary transition-colors active:scale-95">
      {icon}
      <span className="text-[10px] font-medium tracking-wide">{label}</span>
    </Link>
  )
}