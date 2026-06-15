import { Plus } from 'lucide-react'

interface OrderRowProps {
  client: string
  details: string
  total: string
  status: string
}

function OrderRow({ client, details, total, status }: OrderRowProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-card/60 text-sm">
      <div>
        <p className="font-medium">{client}</p>
        <p className="text-xs text-foreground/60 mt-0.5">{details}</p>
      </div>
      <div className="text-right">
        <p className="font-semibold text-primary">{total}</p>
        <p className="text-xs text-foreground/50 mt-0.5">{status}</p>
      </div>
    </div>
  )
}

export function OrderPipeline() {
  return (
    <div className="rounded-xl border border-card bg-card/40 p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-medium tracking-tight">Live Order Pipeline</h3>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-primary text-card text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity cursor-pointer">
          <Plus size={14} /> New Custom Wig Order
        </button>
      </div>
      <div className="space-y-4">
        <OrderRow client="Amani N." details='24" Peruvian Straight Lace Front' total="KES 32,000" status="Processing" />
        <OrderRow client="Zawadi M." details='18" HD Closure Bob Wig' total="KES 24,500" status="Completed" />
        <OrderRow client="Mwende K." details="Custom Colored Deep Wave" total="KES 41,000" status="Pending Verification" />
      </div>
    </div>
  )
}