import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MetricGrid } from '@/components/dashboard/MetricGrid'
import { OrderPipeline } from '@/components/dashboard/OrderPipeline'
import { AuthorizationScope } from '@/components/dashboard/AuthorizationScope'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile, error } = await supabase
    .from('staff_profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] p-8 text-center border border-dashed border-card rounded-2xl bg-card/5">
        <h3 className="text-lg md:text-xl font-medium text-amber-500">Profile Configuration Missing</h3>
        <p className="text-sm text-foreground/60 mt-2 max-w-md">Your security matrix has not synchronized. Please contact the system administrator to verify your credentials.</p>
      </div>
    )
  }

  const isManagement = profile.role === 'admin' || profile.role === 'super_admin'

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Structural Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Welcome back, {profile.full_name.split(' ')[0]}
          </h1>
          <p className="text-sm text-foreground/60 mt-1.5">
            Here is the current system footprint for <span className="text-primary font-semibold">Kilimani Hair</span>.
          </p>
        </div>
        <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium w-fit">
          <span className="relative flex h-2 w-2 mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          System Online
        </div>
      </div>

      {/* Metric Breakdown Grid */}
      <MetricGrid isManagement={isManagement} />

      {/* Detailed Operational Split Panels */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <OrderPipeline />
        </div>
        <div className="lg:col-span-1">
          <AuthorizationScope role={profile.role} isManagement={isManagement} />
        </div>
      </div>
    </div>
  )
}