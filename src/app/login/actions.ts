"use server"

import { createClient } from '@/lib/supabase/server'

interface AuthResponse {
  success: boolean
  error?: string
}

export async function loginAction(prevState: any, formData: FormData): Promise<AuthResponse> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { success: false, error: "Please fill in all security fields." }
  }

  const supabase = await createClient()

  // 1. Attempt to authenticate user via Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError) {
    return { success: false, error: authError.message }
  }

  // 2. Validate that the authenticated identity possesses a valid staff profile record
  const { data: profile, error: profileError } = await supabase
    .from('staff_profiles')
    .select('role')
    .eq('id', authData.user.id)
    .single()

  if (profileError || !profile) {
    // Intruders or public customer accounts attempting access are force-disconnected immediately
    await supabase.auth.signOut()
    return { success: false, error: "Access denied: Security token lack administrative authorization." }
  }

  return { success: true }
}

