import { fetchAnalyticsData } from '@/app/actions/analytics';
import { AnalyticsClient } from './AnalyticsClient';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Crown } from 'lucide-react';

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  
  // Secure Route: Only Super Admins can view analytics
  const { data: profile } = await supabase.from('staff_profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground flex-col gap-4">
        <Crown size={48} className="opacity-20" />
        <p className="font-bold">Access Denied: Super Admin clearance required.</p>
      </div>
    );
  }

  // Fetch initial 30 days data on the server for instant page load
  const initialData = await fetchAnalyticsData(30);

  return (
    <div className="flex flex-col h-full bg-stone-50 dark:bg-background">
      <div className="p-6 md:p-8 border-b border-border/50 bg-background shrink-0">
        <h1 className="text-3xl font-serif font-black tracking-tight text-foreground">Intelligence Dashboard</h1>
        <p className="text-sm font-medium text-muted-foreground mt-1">Real-time business analytics and predictive insights.</p>
      </div>

      <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
        <AnalyticsClient initialData={initialData} />
      </div>
    </div>
  );
}