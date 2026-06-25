import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DesktopNav } from '@/components/dashboard/DesktopNav';
import { MobileNav } from '@/components/dashboard/MobileNav';
import { MobileHeader } from '@/components/dashboard/MobileHeader';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();

  // 1. STRICT AUTHENTICATION GATE
  // If no user session exists, forcefully bounce them to the login screen before rendering anything.
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login'); 
  }

  // 2. SECURE ROLE FETCHING
  const { data: profile, error: profileError } = await supabase
    .from('staff_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
    // Log unexpected errors, but ignore "No Rows Found" (PGRST116) if a profile is still pending creation
    console.error("Dashboard Layout - Profile fetch error:", profileError);
  }

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-background text-foreground overflow-hidden selection:bg-primary/20">
      
      {/* Navigation Injections */}
      <DesktopNav isAdmin={isAdmin} />
      
      <div className="flex-1 flex flex-col min-h-0 relative bg-foreground/[0.01]">
        <MobileHeader />
        
        {/* 3. PREMIUM SAAS BACKGROUND TEXTURE */}
        {/* Injects a subtle, luxurious grid pattern behind the main dashboard workspace */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(var(--foreground-rgb),0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(var(--foreground-rgb),0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        
        {/* pb-24 ensures the bottom content isn't hidden behind the MobileNav on small screens.
          md:pb-8 removes this massive padding on desktop where the sidebar is used.
        */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 pb-24 md:pb-8 custom-scrollbar relative z-10">
          {/* Subtle fade-in animation ensures page transitions feel incredibly smooth */}
          <div className="max-w-7xl mx-auto h-full animate-in fade-in duration-500">
            {children}
          </div>
        </main>

        <MobileNav isAdmin={isAdmin} />
      </div>
      
    </div>
  );
}