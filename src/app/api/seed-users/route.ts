import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Define the exact payload for our development ecosystem
const DEV_USERS = [
  {
    email: 'anton@kilimanihair.co.ke',
    password: 'DevPassword123!',
    full_name: 'Anton (System Lead)',
    role: 'super_admin'
  },
  {
    email: 'jane@kilimanihair.co.ke',
    password: 'DevPassword123!',
    full_name: 'Jane (Store Manager)',
    role: 'admin'
  },
  {
    email: 'phyllis@kilimanihair.co.ke',
    password: 'DevPassword123!',
    full_name: 'Phyllis (Register)',
    role: 'cashier'
  }
]

export async function GET() {
  // 1. Catastrophic Prevention: Never run this in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Forbidden: Seeding is disabled in production environments.' },
      { status: 403 }
    )
  }

  // 2. Initialize the Supabase Admin Client (Bypasses RLS)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const results = []

  // 3. Process each development user
  for (const devUser of DEV_USERS) {
    try {
      // Step A: Create the user in the secure auth.users table
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: devUser.email,
        password: devUser.password,
        email_confirm: true, // Auto-verify so we don't need to click email links
      })

      if (authError) {
        // If user exists, we log it and continue rather than crashing
        if (authError.message.includes('already exists')) {
          results.push({ email: devUser.email, status: 'Already Exists' })
          continue
        }
        throw authError
      }

      if (authData.user) {
        // Step B: Map the generated auth ID to our custom staff_profiles table
        const { error: profileError } = await supabaseAdmin
          .from('staff_profiles')
          .insert({
            id: authData.user.id,
            full_name: devUser.full_name,
            role: devUser.role
          })

        if (profileError) throw profileError

        results.push({ email: devUser.email, role: devUser.role, status: 'Created Successfully' })
      }
    } catch (error: any) {
      console.error(`Failed to create ${devUser.email}:`, error)
      results.push({ email: devUser.email, status: 'Failed', error: error.message })
    }
  }

  return NextResponse.json({
    message: 'Development environment seeding complete.',
    password_for_all_users: 'DevPassword123!',
    results
  })
}