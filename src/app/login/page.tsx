import { LoginForm } from '@/components/auth/LoginForm'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "System Authentication",
  description: "Secure administrative access terminal.",
}

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Active validation session bypass
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative premium depth rings */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-accent/10 rounded-full blur-[80px] pointer-events-none" />
      
      {/* Form Context Assembly */}
      <div className="z-10 w-full max-w-[400px]">
        <LoginForm />
      </div>

      <div className="absolute bottom-6 text-[10px] uppercase tracking-[0.3em] text-stone-600 font-medium">
        Developed by Syengo
      </div>
    </div>
  )
}