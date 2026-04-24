'use client'

import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Topbar } from '@/components/layout/topbar'
import {
  Clock,
  Star,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Flame,
} from 'lucide-react'

interface PopulatedAssignment {
  _id: string
  workshopId: {
    _id: string
    title: string
    vertical: string
    difficulty: string
    estimatedMinutes: number
    totalPoints: number
  }
  dueDate?: string
  priority: string
  status: string
}

interface PopulatedSession {
  _id: string
  workshopId: {
    _id: string
    title: string
    vertical: string
    estimatedMinutes: number
    totalPoints: number
  }
  status: string
  score: number
  maxScore: number
  scorePercent: number
  currentStepIndex: number
  completedAt?: string
  lastActivityAt: string
}

const priorityBadge: Record<string, React.ReactElement> = {
  required: <Badge variant="danger">Required</Badge>,
  recommended: <Badge variant="warning">Recommended</Badge>,
  optional: <Badge variant="outline">Optional</Badge>,
}

const verticalColors: Record<string, string> = {
  security: 'bg-red-50 text-red-700',
  compliance: 'bg-amber-50 text-amber-700',
  onboarding: 'bg-emerald-50 text-emerald-700',
  sales: 'bg-blue-50 text-blue-700',
  customer_ed: 'bg-purple-50 text-purple-700',
  general: 'bg-gray-50 text-gray-700',
}

interface Badge {
  _id: string
  key: string
  name: string
  description: string
  icon: string
  awardedAt: string
}

export default function LearnerDashboardPage() {
  const { data: session } = useSession()
  const token = session?.user?.accessToken

  const { data: assignments = [], isLoading: loadingAssignments } = useQuery<PopulatedAssignment[]>({
    queryKey: ['my-assignments'],
    queryFn: () => api.get('/users/me/assignments', token),
    enabled: !!token,
  })

  const { data: sessions = [], isLoading: loadingSessions } = useQuery<PopulatedSession[]>({
    queryKey: ['my-sessions'],
    queryFn: () => api.get('/users/me/sessions', token),
    enabled: !!token,
  })

  const { data: badges = [] } = useQuery<Badge[]>({
    queryKey: ['my-badges'],
    queryFn: () => api.get('/users/me/badges', token),
    enabled: !!token,
  })

  const overdue = assignments.filter((a) => a.status === 'overdue')
  const pending = assignments.filter((a) => a.status === 'pending' || a.status === 'in_progress')
  const inProgress = sessions.filter((s) => s.status === 'in_progress')
  const completed = sessions.filter((s) => s.status === 'completed')
  const totalScore = completed.reduce((sum, s) => sum + s.score, 0)

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <Topbar title="My Learning" />

      <main className="flex-1 p-6 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Assigned', value: assignments.length, icon: BookOpen, color: 'text-brand' },
            { label: 'Completed', value: completed.length, icon: CheckCircle2, color: 'text-success' },
            { label: 'Overdue', value: overdue.length, icon: AlertCircle, color: 'text-danger' },
            { label: 'Total Points', value: totalScore, icon: Star, color: 'text-amber-500' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-[var(--radius-lg)] bg-card border border-border p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wide">{stat.label}</p>
                  <p className="mt-1.5 text-2xl font-bold text-text-primary">{stat.value}</p>
                </div>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          ))}
        </div>

        {/* Overdue banner */}
        {overdue.length > 0 && (
          <div className="rounded-[var(--radius-lg)] border border-danger/20 bg-red-50 px-4 py-3 flex items-center gap-3">
            <AlertCircle className="h-4 w-4 text-danger flex-shrink-0" />
            <p className="text-sm text-danger">
              <span className="font-semibold">{overdue.length} overdue assignment{overdue.length > 1 ? 's' : ''}</span>
              {' '}— complete them as soon as possible.
            </p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          {/* Left col: assignments */}
          <div className="col-span-2 space-y-4">
            {/* In-progress (resume) */}
            {inProgress.length > 0 && (
              <Section title="Continue where you left off" icon={<Flame className="h-4 w-4 text-amber-500" />}>
                {inProgress.map((s) => (
                  <SessionCard key={s._id} session={s} />
                ))}
              </Section>
            )}

            {/* Pending assignments */}
            <Section title="Your assignments" count={pending.length + overdue.length}>
              {loadingAssignments ? (
                <LoadingRows />
              ) : [...overdue, ...pending].length === 0 ? (
                <EmptyState message="You're all caught up! No pending assignments." />
              ) : (
                [...overdue, ...pending].map((a) => (
                  <AssignmentCard key={a._id} assignment={a} />
                ))
              )}
            </Section>
          </div>

          {/* Right col: completed + badges */}
          <div className="space-y-4">
            {badges.length > 0 && (
              <Section title="Your badges" count={badges.length}>
                <div className="flex flex-wrap gap-2">
                  {badges.map((b) => (
                    <div
                      key={b._id}
                      title={b.description}
                      className="flex items-center gap-1.5 rounded-full border border-border bg-slate-50 px-2.5 py-1"
                    >
                      <span className="text-sm">{b.icon}</span>
                      <span className="text-[11px] font-medium text-brand">{b.name}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}
            <Section title="Completed" count={completed.length}>
              {loadingSessions ? (
                <LoadingRows />
              ) : completed.length === 0 ? (
                <EmptyState message="Complete your first workshop to see it here." />
              ) : (
                completed.slice(0, 8).map((s) => (
                  <CompletedCard key={s._id} session={s} />
                ))
              )}
            </Section>
          </div>
        </div>
      </main>
    </div>
  )
}

function Section({
  title,
  count,
  icon,
  children,
}: {
  title: string
  count?: number
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
        {count !== undefined && (
          <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
            {count}
          </span>
        )}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function AssignmentCard({ assignment: a }: { assignment: PopulatedAssignment }) {
  const isOverdue = a.status === 'overdue'
  const workshop = a.workshopId

  return (
    <div
      className={`rounded-[var(--radius-lg)] border bg-card p-4 ${
        isOverdue ? 'border-danger/30' : 'border-border'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)] ${
            verticalColors[workshop?.vertical] ?? 'bg-gray-50 text-gray-700'
          }`}
        >
          <BookOpen className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-text-primary">{workshop?.title}</p>
            {priorityBadge[a.priority]}
            {isOverdue && <Badge variant="danger">Overdue</Badge>}
          </div>

          <div className="mt-1 flex items-center gap-3 text-[11px] text-text-muted">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />{workshop?.estimatedMinutes} min
            </span>
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3" />{workshop?.totalPoints} pts
            </span>
            {a.dueDate && (
              <span className={isOverdue ? 'text-danger font-medium' : ''}>
                Due {formatDate(a.dueDate)}
              </span>
            )}
          </div>
        </div>

        <Link href={`/learn/workshops/${workshop?._id}/play`}>
          <Button size="sm" variant={isOverdue ? 'primary' : 'secondary'}>
            Start <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  )
}

function SessionCard({ session: s }: { session: PopulatedSession }) {
  const workshop = s.workshopId

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-slate-50 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-brand/10">
          <BookOpen className="h-4 w-4 text-brand" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary">{workshop?.title}</p>
          <div className="mt-1 flex items-center gap-3 text-[11px] text-text-muted">
            <span>Step {s.currentStepIndex} in progress</span>
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3" />{s.score} pts so far
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-1 w-full rounded-full bg-border">
            <div
              className="h-full rounded-full bg-brand transition-all"
              style={{
                width: `${workshop?.totalPoints ? Math.round((s.score / workshop.totalPoints) * 100) : 0}%`,
              }}
            />
          </div>
        </div>
        <Link href={`/learn/workshops/${workshop?._id}/play?session=${s._id}`}>
          <Button size="sm">
            Resume <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  )
}

function CompletedCard({ session: s }: { session: PopulatedSession }) {
  const workshop = s.workshopId
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-border bg-card p-3">
      <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-success" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-text-primary truncate">{workshop?.title}</p>
        <p className="text-[10px] text-text-muted mt-0.5">
          {s.scorePercent}% · {formatDate(s.completedAt ?? s.lastActivityAt)}
        </p>
      </div>
    </div>
  )
}

function LoadingRows() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-16 rounded-[var(--radius-lg)] bg-border/50 animate-pulse" />
      ))}
    </>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-dashed border-border p-6 text-center">
      <p className="text-xs text-text-muted">{message}</p>
    </div>
  )
}
