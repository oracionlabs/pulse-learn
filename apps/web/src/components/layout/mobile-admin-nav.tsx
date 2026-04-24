'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, BookOpen, ClipboardList, Users, MoreHorizontal } from 'lucide-react'

const nav = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Workshops', href: '/workshops', icon: BookOpen },
  { label: 'Assignments', href: '/assignments', icon: ClipboardList },
  { label: 'Users', href: '/users', icon: Users },
  { label: 'More', href: '/settings', icon: MoreHorizontal },
]

export function MobileAdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex md:hidden flex-shrink-0 border-t border-white/[0.06] bg-sidebar">
      {nav.map(({ label, href, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors',
              isActive ? 'text-white' : 'text-sidebar-muted',
            )}
          >
            <Icon className={cn('h-5 w-5', isActive && 'text-brand')} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
