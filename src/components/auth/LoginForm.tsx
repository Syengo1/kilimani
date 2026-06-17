"use client"

import { useState, useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Mail, ShieldAlert, Loader2, Eye, EyeOff } from 'lucide-react'
import { loginAction } from '@/app/login/actions'

export function LoginForm() {
  const router = useRouter()
  // React 19 useActionState handles the transition state natively
  const [state, formAction, isPending] = useActionState(loginAction, { success: false })
  // State to manage password visibility toggle
  const [showPassword, setShowPassword] = useState(false)

  // Route to the dashboard immediately upon successful authentication
  useEffect(() => {
    if (state.success) {
      router.push('/dashboard')
      router.refresh()
    }
  }, [state.success, router])

  return (
    <div className="w-full max-w-md rounded-2xl border border-card bg-card/30 p-8 md:p-10 backdrop-blur-xl shadow-2xl">
      <div className="space-y-2 text-center mb-8">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="text-primary" size={24} />
        </div>
        <h1 className="text-2xl font-serif font-semibold tracking-wide text-foreground">Kilimani Terminal</h1>
        <p className="text-xs text-foreground/50 uppercase tracking-widest font-medium">Secure Authorization Core</p>
      </div>

      {/* Bind the action directly to the form - no manual event.preventDefault() needed */}
      <form action={formAction} className="space-y-5">
        
        {/* Error Feedback Block */}
        {state.error && (
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 animate-in fade-in slide-in-from-top-2 duration-300">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{state.error}</span>
          </div>
        )}

        {/* Identity Inputs */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-foreground/60 px-1" htmlFor="email">
            Staff Email Address
          </label>
          <div className="relative group">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40 transition-colors duration-300 group-focus-within:text-primary">
              <Mail size={18} />
            </span>
            <input
              id="email"
              name="email"
              type="email"
              required
              disabled={isPending}
              className="w-full bg-background/60 border border-border/50 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/60 transition-all disabled:opacity-50"
              placeholder="name@kilimanihair.co.ke"
            />
          </div>
        </div>

        {/* Password Input with Eye Toggle */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-foreground/60 px-1" htmlFor="password">
            Security Access Key
          </label>
          <div className="relative group">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40 transition-colors duration-300 group-focus-within:text-primary">
              <Lock size={18} />
            </span>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              disabled={isPending}
              // pr-12 ensures the text doesn't overlap the eye button
              className="w-full bg-background/60 border border-border/50 rounded-xl pl-11 pr-12 py-3 text-sm tracking-wide focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/60 transition-all disabled:opacity-50"
              placeholder="••••••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isPending}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/80 transition-colors focus:outline-none focus:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Trigger Button Execution */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full mt-2 h-12 bg-primary text-primary-foreground font-semibold tracking-wide text-sm rounded-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 hover:shadow-primary/30"
        >
          {isPending ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Verifying Identity...
            </>
          ) : (
            "Authenticate Terminal Access"
          )}
        </button>
      </form>
    </div>
  )
}