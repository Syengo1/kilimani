import { ReactNode } from 'react';
import { createClient } from '@/lib/supabase/server';
import { DesktopNav } from '@/components/dashboard/DesktopNav';
import { MobileNav } from '@/components/dashboard/MobileNav';
import { MobileHeader } from '@/components/dashboard/MobileHeader';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // Server-side authentication and role fetching
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: profile } = await supabase
    .from('staff_profiles')
    .select('role')
    .eq('id', user?.id)
    .single();

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-background text-foreground overflow-hidden selection:bg-primary/20">
      
      {/* Client Components injected into the Server Layout */}
      <DesktopNav isAdmin={isAdmin} />
      
      <div className="flex-1 flex flex-col min-h-0 relative">
        <MobileHeader />
        
        {/* pb-20 ensures the bottom content isn't hidden behind the MobileNav.
          md:pb-0 removes this padding on desktop where the sidebar is used.
        */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 pb-20 md:pb-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>

        <MobileNav isAdmin={isAdmin} />
      </div>
      
    </div>
  );
}