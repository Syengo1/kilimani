import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DesktopNav } from '@/components/dashboard/DesktopNav';
import { MobileHeader } from '@/components/dashboard/MobileHeader';
import { MobileNav } from '@/components/dashboard/MobileNav';

export type AppRole = 'super_admin' | 'admin' | 'cashier';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // 1. Authenticate the User
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/login');
  }

  // 2. Fetch their strictly verified Role from the staff_profiles table
  const { data: profile } = await supabase
    .from('staff_profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  // If no role is found, they are a regular customer, kick them out to the storefront
  if (!profile || !profile.role) {
    redirect('/'); 
  }

  const role = profile.role as AppRole;
  const userName = profile.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Staff Member';

  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden font-sans selection:bg-primary/20">
      
      {/* DESKTOP: Secure Role-Based Sidebar */}
      <DesktopNav userRole={role} userName={userName} />
      
      {/* MOBILE: Top Header & Bottom Navigation */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <MobileHeader userName={userName} userRole={role} />
        
        {/* The Main Dashboard Workspace with Entry Animation */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 lg:p-10 pb-24 md:pb-10 bg-stone-50 dark:bg-background transition-colors duration-300">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
            {children}
          </div>
        </main>

        <MobileNav userRole={role} />
      </div>

    </div>
  );
}