import { ReactNode } from 'react'

interface MetricCardProps {
  title: string
  value: string
  change: string
  icon: ReactNode
  alert?: boolean
}

export function MetricCard({ title, value, change, icon, alert }: MetricCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
      {/* Decorative premium glow flare on hover */}
      <div className="absolute -inset-px bg-gradient-to-br from-primary/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 rounded-2xl pointer-events-none" />
      
      <div className="relative flex items-start justify-between gap-4">
        <div className="space-y-1.5 flex-1">
          <p className="text-[10px] font-bold text-foreground/50 tracking-widest uppercase truncate">
            {title}
          </p>
          {/* Removed truncate here, adjusted font size to fit grid perfectly */}
          <p className="text-xl lg:text-2xl font-bold tracking-tight text-foreground leading-none">
            {value}
          </p>
          <p className={`text-xs mt-1 truncate ${alert ? 'text-amber-500 font-medium' : 'text-foreground/40'}`}>
            {change}
          </p>
        </div>
        
        {/* Softer icon background using the exact primary token */}
        <div className={`shrink-0 p-2.5 rounded-xl transition-all duration-300 ${
          alert 
            ? 'bg-amber-500/10 text-amber-500 shadow-inner' 
            : 'bg-primary/5 text-primary group-hover:bg-primary/10 shadow-inner'
        }`}>
          {icon}
        </div>
      </div>
    </div>
  )
}