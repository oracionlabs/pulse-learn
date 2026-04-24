'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { Topbar } from '@/components/layout/topbar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { BookOpen, Clock, Star, ArrowRight } from 'lucide-react'

interface Workshop {
  _id: string
  title: string
  description?: string
  vertical: string
  difficulty: string
  estimatedMinutes: number
  totalPoints: number
  isPublished: boolean
}

const verticalColors: Record<string, string> = {
  security: 'bg-red-50 text-red-700',
  compliance: 'bg-amber-50 text-amber-700',
  onboarding: 'bg-emerald-50 text-emerald-700',
  sales: 'bg-blue-50 text-blue-700',
  customer_ed: 'bg-purple-50 text-purple-700',
  general: 'bg-gray-50 text-gray-700',
}

const difficultyBadge: Record<string, React.ReactElement> = {
  beginner: <Badge variant="success">Beginner</Badge>,
  intermediate: <Badge variant="warning">Intermediate</Badge>,
  advanced: <Badge variant="danger">Advanced</Badge>,
}

export default function BrowsePage() {
  const { data: session } = useSession()
  const token = session?.user?.accessToken
  const orgId = session?.user?.orgId
  const qc = useQueryClient()

  const [vertical, setVertical] = useState('')

  const { data: workshops = [], isLoading } = useQuery<Workshop[]>({
    queryKey: ['org-workshops-learner', orgId],
    queryFn: () => api.get(`/orgs/${orgId}/workshops?page=1&limit=100`, token).then((r: unknown) => (r as { data: Workshop[] }).data),
    enabled: !!token && !!orgId,
  })

  const startMutation = useMutation<{ _id: string; workshopId: string }, Error, string>({
    mutationFn: (workshopId: string) =>
      api.post<{ _id: string; workshopId: string }>('/sessions/start', { workshopId }, token),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['my-sessions'] })
      window.location.href = `/learn/workshops/${data.workshopId}/play?session=${data._id}`
    },
  })

  const verticals = [...new Set(workshops.map((w) => w.vertical))].filter(Boolean)
  const filtered = vertical ? workshops.filter((w) => w.vertical === vertical) : workshops

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <Topbar title="Browse Workshops" />

      <main className="flex-1 p-6 space-y-4">
        {/* Vertical filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setVertical('')}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              vertical === ''
                ? 'bg-brand text-white'
                : 'bg-border/50 text-text-muted hover:bg-border'
            }`}
          >
            All
          </button>
          {verticals.map((v) => (
            <button
              key={v}
              onClick={() => setVertical(v)}
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                vertical === v
                  ? 'bg-brand text-white'
                  : 'bg-border/50 text-text-muted hover:bg-border'
              }`}
            >
              {v.replace('_', ' ')}
            </button>
          ))}
          <span className="ml-auto text-xs text-text-muted">{filtered.length} workshops</span>
        </div>

        {/* Workshop grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-36 rounded-[var(--radius-lg)] bg-border/50 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-dashed border-border p-12 text-center">
            <p className="text-sm text-text-muted">No workshops available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filtered.map((w) => (
              <div
                key={w._id}
                className="rounded-[var(--radius-lg)] border border-border bg-card p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)] ${
                      verticalColors[w.vertical] ?? 'bg-gray-50 text-gray-700'
                    }`}
                  >
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary leading-snug">{w.title}</p>
                    {w.description && (
                      <p className="mt-0.5 text-xs text-text-muted line-clamp-2">{w.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-text-muted">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />{w.estimatedMinutes} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3" />{w.totalPoints} pts
                  </span>
                  {difficultyBadge[w.difficulty]}
                </div>

                <div className="flex items-center gap-2 mt-auto">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => startMutation.mutate(w._id)}
                    loading={startMutation.isPending && startMutation.variables === w._id}
                  >
                    Start <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
