'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/avatar'
import {
  LayoutDashboard,
  BookOpen,
  Users,
  ClipboardList,
  BarChart2,
  Settings,
  Trophy,
  Zap,
  LogOut,
  CreditCard,
  Building2,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const adminNav: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Workshops', href: '/workshops', icon: BookOpen },
  { label: 'Assignments', href: '/assignments', icon: ClipboardList },
  { label: 'Users', href: '/users', icon: Users },
  { label: 'Departments', href: '/departments', icon: Building2 },
  { label: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  { label: 'Reports', href: '/reports', icon: BarChart2 },
]

const adminOther: NavItem[] = [
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'Billing', href: '/billing', icon: CreditCard },
]

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname()
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      className={cn(
        'relative flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm transition-colors duration-100',
        isActive
          ? 'bg-white/[0.07] text-white font-medium'
          : 'text-sidebar-muted hover:bg-white/[0.04] hover:text-white/80',
      )}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-full bg-brand" />
      )}
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span>{item.label}</span>
    </Link>
  )
}

export function AdminSidebar() {
  const { data: session } = useSession()

  return (
    <aside className="hidden md:flex h-screen w-56 flex-shrink-0 flex-col bg-sidebar border-r border-white/[0.06]">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-white/[0.06]">
        <div className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] bg-brand">
          <Zap className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-sm font-semibold text-white tracking-tight">Pulse</span>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <div className="space-y-px">
          {adminNav.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>

        <div className="mt-6">
          <p className="mb-1 px-3 text-[10px] font-medium uppercase tracking-widest text-white/25">
            Account
          </p>
          <div className="space-y-px">
            {adminOther.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>
        </div>
      </nav>

      {/* Bottom user area */}
      <div className="border-t border-white/[0.06] p-3">
        <div className="flex items-center gap-2.5 rounded-[var(--radius-md)] px-2 py-2">
          <Avatar name={session?.user?.name ?? 'Admin'} src={session?.user?.image} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{session?.user?.name ?? 'Admin'}</p>
            <p className="text-[10px] text-sidebar-muted truncate">{session?.user?.email}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-sidebar-muted hover:text-white/70 transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
