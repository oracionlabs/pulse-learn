import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'outline'

interface BadgeProps {
  variant?: BadgeVariant
  className?: string
  children: React.ReactNode
}

const variants: Record<BadgeVariant, string> = {
  default:  'bg-slate-100 text-slate-600',
  success:  'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60',
  warning:  'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60',
  danger:   'bg-red-50 text-red-600 ring-1 ring-red-200/60',
  info:     'bg-sky-50 text-sky-700 ring-1 ring-sky-200/60',
  purple:   'bg-violet-50 text-violet-700 ring-1 ring-violet-200/60',
  outline:  'ring-1 ring-border text-text-secondary bg-transparent',
}

export function Badge({ variant = 'default', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[var(--radius-sm)] px-2 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
