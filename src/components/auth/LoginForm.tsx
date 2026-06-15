"use client"

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Mail, ShieldAlert, Loader2 } from 'lucide-react'
import { loginAction } from '@/app/login/actions'

export function LoginForm() {
  const router = useRouter()
  // React 19 useActionState handles the transition state natively
  const [state, formAction, isPending] = useActionState(loginAction, { success: false })

  // Route to the dashboard immediately upon successful authentication
  useEffect(() => {
    if (state.success) {
      router.push('/dashboard')
      router.refresh()
    }
  }, [state.success, router])

  return (
    <div className="w-full max-w-md rounded-2xl border border-card bg-card/30 p-8 backdrop-blur-md shadow-2xl">
      <div className="space-y-2 text-center mb-8">
        <h1 className="text-2xl font-semibold tracking-wide text-primary">Kilimani Hair</h1>
        <p className="text-xs text-foreground/50 uppercase tracking-widest">Internal Terminal Core</p>
      </div>

      {/* Bind the action directly to the form - no manual event.preventDefault() needed */}
      <form action={formAction} className="space-y-5">
        
        {/* Error Feedback Block */}
        {state.error && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <span>{state.error}</span>
          </div>
        )}

        {/* Identity Inputs */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground/70" htmlFor="email">Staff Email Address</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40"><Mail size={16} /></span>
            <input
              id="email"
              name="email"
              type="email"
              required
              disabled={isPending}
              className="w-full bg-background/60 border border-card/80 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary/60 transition-colors disabled:opacity-50"
              placeholder="name@kilimanihair.co.ke"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground/70" htmlFor="password">Security Access Key</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40"><Lock size={16} /></span>
            <input
              id="password"
              name="password"
              type="password"
              required
              disabled={isPending}
              className="w-full bg-background/60 border border-card/80 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary/60 transition-colors disabled:opacity-50"
              placeholder="••••••••••••"
            />
          </div>
        </div>

        {/* Trigger Button Execution */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full h-11 bg-primary text-card font-medium text-sm rounded-lg hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Verifying Authorization...
            </>
          ) : (
            "Authenticate Terminal Access"
          )}
        </button>
      </form>
    </div>
  )
}