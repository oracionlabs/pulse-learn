import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  trend?: { value: number; label: string }
  icon: React.ElementType
  className?: string
}

export function StatCard({ title, value, trend, icon: Icon, className }: StatCardProps) {
  const isPositive = trend && trend.value >= 0

  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)] bg-card border border-border p-5',
        className,
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wide">{title}</p>
        <Icon className="h-4 w-4 text-text-muted flex-shrink-0" />
      </div>

      <p className="text-2xl font-semibold text-text-primary tabular-nums">{value}</p>

      {trend && (
        <div className="mt-2 flex items-center gap-1.5">
          {isPositive ? (
            <TrendingUp className="h-3 w-3 text-success" />
          ) : (
            <TrendingDown className="h-3 w-3 text-danger" />
          )}
          <span className={cn('text-xs font-medium', isPositive ? 'text-success' : 'text-danger')}>
            {isPositive ? '+' : ''}{trend.value}%
          </span>
          <span className="text-xs text-text-muted">{trend.label}</span>
        </div>
      )}
    </div>
  )
}
