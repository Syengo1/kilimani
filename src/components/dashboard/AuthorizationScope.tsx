import { ShieldCheck } from 'lucide-react'

interface PermissionBadgeProps {
  label: string
  active: boolean
}

function PermissionBadge({ label, active }: PermissionBadgeProps) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition-all ${
      active 
        ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' 
        : 'bg-background/40 text-foreground/30 border border-card/40 line-through'
    }`}>
      <span className="truncate pr-2">{label}</span>
      <span className="text-[9px] uppercase font-mono tracking-widest shrink-0">
        {active ? 'Granted' : 'Locked'}
      </span>
    </div>
  )
}

interface AuthorizationScopeProps {
  role: 'super_admin' | 'admin' | 'cashier'
  isManagement: boolean
}

export function AuthorizationScope({ role, isManagement }: AuthorizationScopeProps) {
  return (
    <div className="h-full rounded-2xl border border-card/60 bg-card/20 p-5 md:p-6 backdrop-blur-sm flex flex-col space-y-6 relative overflow-hidden">
      {/* Decorative background shield */}
      <ShieldCheck className="absolute -bottom-6 -right-6 w-32 h-32 text-primary/5 pointer-events-none" />

      <h3 className="text-base font-semibold tracking-tight">Authorization Scope</h3>
      
      <div className="space-y-2.5 flex-1 relative z-10">
        <PermissionBadge label="Access Terminal POS" active={true} />
        <PermissionBadge label="Modify Inventory Stock" active={isManagement} />
        <PermissionBadge label="Provision Staff Profiles" active={role === 'super_admin'} />
        <PermissionBadge label="Export Statements" active={isManagement} />
      </div>
      
      <div className="pt-5 border-t border-card/60 relative z-10">
        <p className="text-[11px] text-foreground/50 leading-relaxed">
          Security context enforced at network edge via RLS policies. Signed with Token UID: 
        </p>
        <code className="block w-full bg-background/80 border border-card/60 px-2 py-1.5 rounded-lg text-primary font-mono text-[10px] mt-2 whitespace-pre-wrap break-all shadow-inner select-all">
          session.auth.uid()
        </code>
      </div>
    </div>
  )
}