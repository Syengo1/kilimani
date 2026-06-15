import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// 🚨 PERFORMANCE FIX: Singleton pattern prevents memory leaks during React re-renders
let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null;

export function createClient() {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return supabaseInstance;
}