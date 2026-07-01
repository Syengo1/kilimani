'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function secureSignOut() {
  const supabase = await createClient();

  // 1. Terminate the session on Supabase auth servers & clear server cookies completely
  await supabase.auth.signOut();

  // 2. Perform a hard server-side redirect to wipe the client-side router cache
  redirect('/login');
}