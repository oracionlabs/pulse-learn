'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/avatar'
import {
  LayoutDashboard,
  BookOpen,
  Trophy,
  Bell,
  LogOut,
  Zap,
  ChevronRight,
} from 'lucide-react'

const nav = [
  { label: 'My Learning', href: '/learn/dashboard', icon: LayoutDashboard },
  { label: 'Browse', href: '/learn/browse', icon: BookOpen },
  { label: 'Leaderboard', href: '/learn/leaderboard', icon: Trophy },
]

export function LearnerSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <aside className="flex h-screen w-56 flex-shrink-0 flex-col bg-sidebar">
      <div className="flex items-center gap-2.5 px-4 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-brand shadow-sm">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <span className="text-base font-bold text-white tracking-tight">Pulse</span>
      </div>

      <nav className="flex-1 px-3 pb-4 space-y-0.5">
        {nav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm transition-all duration-150',
                isActive
                  ? 'bg-brand text-white font-medium shadow-sm shadow-brand/30'
                  : 'text-sidebar-muted hover:bg-white/6 hover:text-white',
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span>{item.label}</span>
              {isActive && <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-60" />}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-white/8 p-3 space-y-1">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <Avatar name={session?.user?.name ?? 'Learner'} src={session?.user?.image} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{session?.user?.name}</p>
            <p className="text-[10px] text-sidebar-muted truncate">{session?.user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2 text-sm text-sidebar-muted hover:text-white hover:bg-white/6 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
