import { DollarSign, Users, TrendingUp, ShoppingBag, Package, AlertTriangle } from 'lucide-react'
import { MetricCard } from './MetricCard'

interface MetricGridProps {
  isManagement: boolean
}

export function MetricGrid({ isManagement }: MetricGridProps) {
  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
      {isManagement ? (
        <>
          <MetricCard 
            title="Gross Revenue (MTD)" 
            value="KES 1,240,000" 
            change="+12.3% vs last month" 
            icon={<DollarSign size={20} />} 
          />
          <MetricCard 
            title="Total Staff Active" 
            value="8 Workers" 
            change="3 Cashiers on shift" 
            icon={<Users size={20} />} 
          />
        </>
      ) : (
        <>
          <MetricCard 
            title="Your Register Sales" 
            value="KES 45,600" 
            change="Shift ends in 3 hours" 
            icon={<TrendingUp size={20} />} 
          />
          <MetricCard 
            title="Orders Processed" 
            value="14 Wigs" 
            change="Average processing: 8 mins" 
            icon={<ShoppingBag size={20} />} 
          />
        </>
      )}
      <MetricCard 
        title="Total Stock Units" 
        value="342 Wigs" 
        change="12 variants out of stock" 
        icon={<Package size={20} />} 
      />
      <MetricCard 
        title="Critical Alerts" 
        value="2 Action Items" 
        change="Restock & reconciliation needed" 
        icon={<AlertTriangle size={20} className="text-amber-500" />} 
        alert
      />
    </div>
  )
}