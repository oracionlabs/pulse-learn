'use client'

import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { Topbar } from '@/components/layout/topbar'
import { StatCard } from '@/components/dashboard/stat-card'
import { CompletionChart } from '@/components/dashboard/completion-chart'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { api } from '@/lib/api'
import { formatRelativeTime, formatDate } from '@/lib/utils'
import {
  Users,
  BookOpen,
  CheckCircle2,
  Star,
  AlertCircle,
  Clock,
} from 'lucide-react'

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
    lastActivityAt: string
    userId: { _id: string; name: string; email: string } | null
    workshopId: { _id: string; title: string } | null
  }[]
  overdueAssignments: {
    _id: string
    dueDate?: string
    workshopId: { _id: string; title: string } | null
    assignedTo: { type: string; id: { _id: string; name: string } | null }
  }[]
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const token = session?.user?.accessToken
  const orgId = session?.user?.orgId

  const { data: stats, isLoading } = useQuery<OrgStats>({
    queryKey: ['org-stats', orgId],
    queryFn: () => api.get(`/orgs/${orgId}/stats`, token),
    enabled: !!token && !!orgId,
  })

  // Build a simple 7-day chart from completedSessions count (placeholder shape)
  const weeklyData = [
    { label: 'Mon', value: 0 },
    { label: 'Tue', value: 0 },
    { label: 'Wed', value: 0 },
    { label: 'Thu', value: 0 },
    { label: 'Fri', value: 0 },
    { label: 'Sat', value: 0 },
    { label: 'Sun', value: 0 },
  ]
  if (stats?.recentSessions) {
    for (const s of stats.recentSessions) {
      if (s.status === 'completed') {
        const day = new Date(s.lastActivityAt).getDay() // 0=Sun
        const idx = day === 0 ? 6 : day - 1
        weeklyData[idx].value += 1
      }
    }
  }

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <Topbar title="Dashboard" />

      <main className="flex-1 p-6 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            title="Total Users"
            value={isLoading ? '—' : String(stats?.totalUsers ?? 0)}
            icon={Users}
          />
          <StatCard
            title="Active Workshops"
            value={isLoading ? '—' : String(stats?.activeWorkshops ?? 0)}
            icon={BookOpen}
          />
          <StatCard
            title="Completed Sessions"
            value={isLoading ? '—' : String(stats?.completedSessions ?? 0)}
            icon={CheckCircle2}
          />
          <StatCard
            title="Avg Score"
            value={isLoading ? '—' : `${stats?.avgScore ?? 0}%`}
            icon={Star}
          />
        </div>

        {/* Charts + overdue */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Completions this week</CardTitle>
              <span className="text-xs text-text-muted">
                {weeklyData.reduce((s, d) => s + d.value, 0)} total
              </span>
            </CardHeader>
            <CompletionChart data={weeklyData} title="" />
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Overdue</CardTitle>
              <Badge variant="danger">{stats?.overdueCount ?? 0}</Badge>
            </CardHeader>
            <div className="space-y-3">
              {isLoading ? (
                <div className="h-20 animate-pulse rounded-lg bg-border/40" />
              ) : (stats?.overdueAssignments ?? []).length === 0 ? (
                <p className="text-xs text-text-muted">No overdue assignments.</p>
              ) : (
                (stats?.overdueAssignments ?? []).map((item) => (
                  <div key={item._id} className="flex items-start gap-2.5">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-danger" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-text-primary truncate">
                        {item.assignedTo?.id?.name ?? 'Unknown User'}
                      </p>
                      <p className="text-[11px] text-text-muted truncate">
                        {item.workshopId?.title ?? 'Unknown Workshop'}
                      </p>
                      {item.dueDate && (
                        <span className="text-[10px] text-text-muted flex items-center gap-0.5 mt-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          Due {formatDate(item.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Activity feed */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {isLoading ? (
              <div className="h-32 animate-pulse rounded-lg bg-border/40" />
            ) : (stats?.recentSessions ?? []).length === 0 ? (
              <p className="text-xs text-text-muted">No activity yet.</p>
            ) : (
              (stats?.recentSessions ?? []).slice(0, 10).map((s) => (
                <div key={s._id} className="flex items-center gap-3">
                  <Avatar name={s.userId?.name ?? 'User'} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text-primary">
                      <span className="font-medium">{s.userId?.name ?? 'Unknown'}</span>{' '}
                      <span className="text-text-muted">
                        {s.status === 'completed' ? 'completed' : 'is working on'}
                      </span>{' '}
                      <span className="font-medium">{s.workshopId?.title ?? 'a workshop'}</span>
                    </p>
                  </div>
                  <span className="text-[11px] text-text-muted flex-shrink-0">
                    {formatRelativeTime(s.lastActivityAt)}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </main>
    </div>
  )
}
