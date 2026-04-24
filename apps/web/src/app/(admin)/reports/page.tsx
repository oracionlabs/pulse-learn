'use client'

import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { Topbar } from '@/components/layout/topbar'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { CheckCircle2, Clock, Star } from 'lucide-react'

interface OrgStats {
  totalUsers: number
  activeWorkshops: number
  overdueCount: number
  completedSessions: number
  avgScore: number
  recentSessions: {
    _id: string
    status: string
    score: number
    scorePercent: number
    lastActivityAt: string
    completedAt?: string
    userId: { _id: string; name: string; email: string } | null
    workshopId: { _id: string; title: string } | null
  }[]
}

export default function ReportsPage() {
  const { data: session } = useSession()
  const token = session?.user?.accessToken
  const orgId = session?.user?.orgId

  const { data: stats, isLoading } = useQuery<OrgStats>({
    queryKey: ['org-stats', orgId],
    queryFn: () => api.get(`/orgs/${orgId}/stats`, token),
    enabled: !!token && !!orgId,
  })

  const completed = (stats?.recentSessions ?? []).filter((s) => s.status === 'completed')
  const inProgress = (stats?.recentSessions ?? []).filter((s) => s.status === 'in_progress')

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <Topbar title="Reports" />

      <main className="flex-1 p-6 space-y-6">
        {/* Summary row */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: Clock },
            { label: 'Workshops Active', value: stats?.activeWorkshops ?? 0, icon: Star },
            { label: 'Sessions Completed', value: stats?.completedSessions ?? 0, icon: CheckCircle2 },
            { label: 'Avg Score', value: `${stats?.avgScore ?? 0}%`, icon: Star },
          ].map((s) => (
            <div key={s.label} className="rounded-[var(--radius-lg)] border border-border bg-card p-4">
              <p className="text-xs text-text-muted uppercase tracking-wide">{s.label}</p>
              <p className="mt-1.5 text-2xl font-bold text-text-primary">
                {isLoading ? '—' : s.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Completed sessions */}
          <div>
            <h2 className="text-sm font-semibold text-text-primary mb-3">
              Completed Sessions{' '}
              <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
                {completed.length}
              </span>
            </h2>
            <div className="rounded-[var(--radius-lg)] border border-border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-[#fafafa]">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted">Learner</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted">Workshop</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-text-muted">Score</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-text-muted">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-xs text-text-muted">Loading…</td></tr>
                  ) : completed.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-xs text-text-muted">No completed sessions yet.</td></tr>
                  ) : completed.map((s) => (
                    <tr key={s._id} className="hover:bg-[#fafafa]">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <Avatar name={s.userId?.name ?? 'User'} size="sm" />
                          <span className="text-xs text-text-primary">{s.userId?.name ?? '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-text-muted truncate max-w-[140px]">
                        {s.workshopId?.title ?? '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Badge variant={s.scorePercent >= 80 ? 'success' : s.scorePercent >= 60 ? 'warning' : 'danger'}>
                          {s.scorePercent}%
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs text-text-muted">
                        {formatDate(s.completedAt ?? s.lastActivityAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* In-progress sessions */}
          <div>
            <h2 className="text-sm font-semibold text-text-primary mb-3">
              In Progress{' '}
              <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
                {inProgress.length}
              </span>
            </h2>
            <div className="rounded-[var(--radius-lg)] border border-border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-[#fafafa]">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted">Learner</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted">Workshop</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-text-muted">Score so far</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-text-muted">Last Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-xs text-text-muted">Loading…</td></tr>
                  ) : inProgress.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-xs text-text-muted">No active sessions.</td></tr>
                  ) : inProgress.map((s) => (
                    <tr key={s._id} className="hover:bg-[#fafafa]">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <Avatar name={s.userId?.name ?? 'User'} size="sm" />
                          <span className="text-xs text-text-primary">{s.userId?.name ?? '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-text-muted truncate max-w-[140px]">
                        {s.workshopId?.title ?? '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs font-medium text-text-primary">
                        {s.score} pts
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs text-text-muted">
                        {formatDate(s.lastActivityAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
