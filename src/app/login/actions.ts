"use server"

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// 1. Strict Input Validation Schema
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email format." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." })
})

export interface AuthResponse {
  success: boolean
  error?: string
}

// 2. Properly typed Server Action
export async function loginAction(
  prevState: AuthResponse | null, 
  formData: FormData
): Promise<AuthResponse> {
  // Security: Artificial delay mitigates automated brute-force timing attacks
  await new Promise(resolve => setTimeout(resolve, 800))

  const email = formData.get('email')
  const password = formData.get('password')

  // 3. Schema Execution
  const parsed = loginSchema.safeParse({ email, password })
  if (!parsed.success) {
    // FIX: Using .issues instead of .errors resolves the TypeScript mismatch
    return { success: false, error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()

  // 4. Authenticate Identity
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (authError || !authData.user) {
    // Security: Never reveal whether the email exists or the password was wrong. Use a generic message.
    return { success: false, error: "Invalid email credentials or password." }
  }

  // 5. Zero-Trust Role Validation
  const { data: profile, error: profileError } = await supabase
    .from('staff_profiles')
    .select('role')
    .eq('id', authData.user.id)
    .single()

  if (profileError || !profile) {
    await supabase.auth.signOut()
    return { success: false, error: "Access denied. Security token lacks administrative authorization." }
  }

  return { success: true }
}