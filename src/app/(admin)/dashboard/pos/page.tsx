import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { POSClient } from './POSClient';

export default async function POSPage() {
  const supabase = await createClient();

  // 1. Bulletproof Server-Side Auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // 2. Fetch Cashier Profile
  const { data: profile } = await supabase
    .from('staff_profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  const cashierName = profile?.full_name || user.email?.split('@')[0] || 'Unknown Cashier';

  // 3. Pass data securely to the Client UI
  return <POSClient cashierName={cashierName} />;
}