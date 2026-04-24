'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { Search, Bell, Plus, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { api } from '@/lib/api'
import { formatRelativeTime } from '@/lib/utils'

interface Notification {
  _id: string
  type: string
  title: string
  body: string
  link?: string
  read: boolean
  createdAt: string
}

interface TopbarProps {
  title: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
}

const typeIcon: Record<string, string> = {
  badge: '🏅',
  assignment: '📋',
  overdue: '⚠️',
  completion: '✅',
  system: '🔔',
  reminder: '⏰',
  streak: '🔥',
}

export function Topbar({ title, action }: TopbarProps) {
  const { data: session } = useSession()
  const token = session?.user?.accessToken
  const qc = useQueryClient()

  const [bellOpen, setBellOpen] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)

  const { data: unread } = useQuery<{ count: number }>({
    queryKey: ['notif-count'],
    queryFn: () => api.get('/users/me/notifications/unread-count', token),
    enabled: !!token,
    refetchInterval: 30000,
  })

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => api.get('/users/me/notifications?limit=15', token),
    enabled: !!token && bellOpen,
  })

  const markAllMutation = useMutation({
    mutationFn: () => api.patch('/users/me/notifications/read-all', {}, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notif-count'] })
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const markOneMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/users/me/notifications/${id}/read`, {}, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notif-count'] })
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  // Close dropdown on outside click
  useEffect(() => {
    if (!bellOpen) return
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [bellOpen])

  const count = unread?.count ?? 0

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-white px-6">
      <h1 className="text-base font-semibold text-text-primary">{title}</h1>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="flex h-8 w-56 items-center gap-2 rounded-[var(--radius-md)] border border-border bg-slate-50 px-3">
          <Search className="h-3.5 w-3.5 text-text-muted" />
          <input
            placeholder="Search…"
            className="flex-1 bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
          />
        </div>

        {/* Notification bell */}
        <div ref={bellRef} className="relative">
          <button
            onClick={() => setBellOpen((v) => !v)}
            className="relative flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] border border-border bg-white text-text-secondary hover:bg-page transition-colors"
          >
            <Bell className="h-4 w-4" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-brand text-[9px] font-bold text-white">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 top-10 z-50 w-80 rounded-[var(--radius-lg)] border border-border bg-card shadow-xl">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="text-xs font-semibold text-text-primary">Notifications</span>
                {count > 0 && (
                  <button
                    onClick={() => markAllMutation.mutate()}
                    className="flex items-center gap-1 text-[11px] text-brand hover:underline"
                  >
                    <CheckCheck className="h-3 w-3" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-xs text-text-muted">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => !n.read && markOneMutation.mutate(n._id)}
                      className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors border-b border-border/50 last:border-0 ${
                        !n.read ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <span className="text-base flex-shrink-0 mt-0.5">
                        {typeIcon[n.type] ?? '🔔'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-text-primary leading-snug">
                          {n.title}
                        </p>
                        <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">
                          {n.body}
                        </p>
                        <p className="text-[10px] text-text-muted mt-1">
                          {formatRelativeTime(n.createdAt)}
                        </p>
                      </div>
                      {!n.read && (
                        <div className="h-1.5 w-1.5 rounded-full bg-brand flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action button */}
        {action && (
          action.href ? (
            <Link href={action.href}>
              <Button size="sm">
                <Plus className="h-3.5 w-3.5" />
                {action.label}
              </Button>
            </Link>
          ) : (
            <Button size="sm" onClick={action.onClick}>
              <Plus className="h-3.5 w-3.5" />
              {action.label}
            </Button>
          )
        )}

        {/* Avatar */}
        <Avatar name={session?.user?.name ?? 'User'} src={session?.user?.image} size="sm" />
      </div>
    </header>
  )
}
