'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Topbar } from '@/components/layout/topbar'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { Workshop } from '@pulse/shared'
import {
  BookOpen,
  Plus,
  MoreHorizontal,
  Clock,
  Star,
  Copy,
  Trash2,
  Eye,
  Edit2,
  Sparkles,
  X,
} from 'lucide-react'

type Tab = 'my-workshops' | 'templates'

export default function WorkshopsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('my-workshops')

  const token = session?.user?.accessToken
  const orgId = session?.user?.orgId

  const [page, setPage] = useState(1)
  const { data: workshopsResp, isLoading } = useQuery<{ data: Workshop[]; total: number; pages: number }>({
    queryKey: ['workshops', orgId, page],
    queryFn: () => api.get(`/orgs/${orgId}/workshops?page=${page}&limit=20`, token),
    enabled: !!orgId,
  })
  const workshops = workshopsResp?.data ?? []

  const { data: templates = [] } = useQuery<Workshop[]>({
    queryKey: ['templates'],
    queryFn: () => api.get('/workshops'),
    enabled: tab === 'templates',
  })

  const createMutation = useMutation<Workshop, Error, void>({
    mutationFn: () =>
      api.post<Workshop>(`/orgs/${orgId}/workshops`, { title: 'Untitled Workshop', steps: [] }, token),
    onSuccess: (workshop) => {
      queryClient.invalidateQueries({ queryKey: ['workshops', orgId] })
      router.push(`/workshops/${workshop._id}/edit`)
    },
  })

  const cloneMutation = useMutation<Workshop, Error, string>({
    mutationFn: (templateId: string) =>
      api.post<Workshop>(`/orgs/${orgId}/workshops/${templateId}/clone`, {}, token),
    onSuccess: (workshop) => {
      queryClient.invalidateQueries({ queryKey: ['workshops', orgId] })
      router.push(`/workshops/${workshop._id}/edit`)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/orgs/${orgId}/workshops/${id}`, token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workshops', orgId] }),
  })

  const displayed = tab === 'templates' ? templates : workshops
  const [showAi, setShowAi] = useState(false)

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <Topbar
        title="Workshops"
        action={{ label: 'New Workshop', onClick: () => createMutation.mutate() }}
      />

      <main className="flex-1 p-6">
        {/* AI Generator banner */}
        <div className="mb-4 flex items-center justify-between rounded-[var(--radius-lg)] border border-border bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-4 w-4 text-brand" />
            <p className="text-sm text-text-primary">
              <span className="font-medium">AI Workshop Generator</span>
              {' '}— describe a topic and let AI build the workshop for you.
            </p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => setShowAi(true)}>
            Generate with AI
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 rounded-[var(--radius-md)] bg-white border border-border p-1 w-fit">
          {(['my-workshops', 'templates'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-[var(--radius-sm)] text-sm font-medium transition-all duration-150 ${
                tab === t
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {t === 'my-workshops' ? 'My Workshops' : 'Global Templates'}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          </div>
        ) : displayed.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-10 w-10 text-text-muted mb-3" />
            <p className="text-sm font-medium text-text-primary">No workshops yet</p>
            <p className="text-xs text-text-muted mt-1 mb-4">
              {tab === 'my-workshops'
                ? 'Create your first workshop or use a global template.'
                : 'No global templates available.'}
            </p>
            {tab === 'my-workshops' && (
              <Button size="sm" onClick={() => createMutation.mutate()} loading={createMutation.isPending}>
                <Plus className="h-3.5 w-3.5" /> New Workshop
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {displayed.map((workshop) => (
              <WorkshopRow
                key={workshop._id}
                workshop={workshop}
                isTemplate={tab === 'templates'}
                onEdit={() => router.push(`/workshops/${workshop._id}/edit`)}
                onPreview={() => router.push(`/workshops/${workshop._id}/preview`)}
                onClone={() => cloneMutation.mutate(workshop._id)}
                onDelete={() => deleteMutation.mutate(workshop._id)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {tab === 'my-workshops' && workshopsResp && workshopsResp.pages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-text-secondary">
              {workshopsResp.total} workshops · page {page} of {workshopsResp.pages}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                Previous
              </Button>
              <Button size="sm" variant="secondary" disabled={page >= workshopsResp.pages} onClick={() => setPage(p => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </main>

      {showAi && (
        <AiGeneratorModal
          orgId={orgId!}
          token={token!}
          onClose={() => setShowAi(false)}
          onCreated={(workshop) => {
            setShowAi(false)
            queryClient.invalidateQueries({ queryKey: ['workshops', orgId] })
            router.push(`/workshops/${workshop._id}/edit`)
          }}
        />
      )}
    </div>
  )
}

function AiGeneratorModal({
  orgId,
  token,
  onClose,
  onCreated,
}: {
  orgId: string
  token: string
  onClose: () => void
  onCreated: (w: Workshop) => void
}) {
  const [topic, setTopic] = useState('')
  const [vertical, setVertical] = useState('general')
  const [difficulty, setDifficulty] = useState('beginner')
  const [stepCount, setStepCount] = useState(5)
  const [includeQuiz, setIncludeQuiz] = useState(true)
  const [includeScenario, setIncludeScenario] = useState(true)
  const [error, setError] = useState('')
  const queryClient = useQueryClient()
  const router = useRouter()

  const generateMutation = useMutation({
    mutationFn: async () => {
      // Generate content via AI
      const generated = await api.post<{
        title: string
        description: string
        vertical: string
        difficulty: string
        steps: unknown[]
        totalPoints: number
      }>(`/orgs/${orgId}/ai/generate-workshop`, {
        topic, vertical, difficulty, stepCount, includeQuiz, includeScenario,
      }, token)

      // Save as real workshop
      return api.post<Workshop>(`/orgs/${orgId}/workshops`, {
        title: generated.title,
        description: generated.description,
        vertical: generated.vertical,
        difficulty: generated.difficulty,
        steps: generated.steps,
        totalPoints: generated.totalPoints,
      }, token)
    },
    onSuccess: onCreated,
    onError: (e: Error) => setError(e.message),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[var(--radius-xl)] bg-card border border-border shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand" />
            <h2 className="text-base font-semibold text-text-primary">AI Workshop Generator</h2>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1.5">
              Topic or learning goal
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Password hygiene and phishing prevention for new employees"
              rows={3}
              className="w-full rounded-[var(--radius-md)] border border-border bg-white px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1.5">Vertical</label>
              <select
                value={vertical}
                onChange={(e) => setVertical(e.target.value)}
                className="w-full rounded-[var(--radius-md)] border border-border bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/30"
              >
                {['security','compliance','onboarding','sales','customer_ed','general'].map(v => (
                  <option key={v} value={v}>{v.replace('_',' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1.5">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full rounded-[var(--radius-md)] border border-border bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/30"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1.5">Steps</label>
              <select
                value={stepCount}
                onChange={(e) => setStepCount(parseInt(e.target.value, 10))}
                className="w-full rounded-[var(--radius-md)] border border-border bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/30"
              >
                {[3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} steps</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-4">
            {[
              { key: 'includeQuiz', label: 'Include quiz questions', state: includeQuiz, set: setIncludeQuiz },
              { key: 'includeScenario', label: 'Include scenario choices', state: includeScenario, set: setIncludeScenario },
            ].map(({ key, label, state, set }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={state}
                  onChange={(e) => set(e.target.checked)}
                  className="rounded border-border accent-brand"
                />
                <span className="text-xs text-text-primary">{label}</span>
              </label>
            ))}
          </div>

          {error && <p className="text-xs text-danger">{error}</p>}

          {generateMutation.isPending && (
            <div className="rounded-[var(--radius-md)] border border-border bg-slate-50 px-4 py-3 text-xs text-brand">
              <Sparkles className="h-3.5 w-3.5 inline mr-1.5 animate-pulse" />
              AI is generating your workshop… this takes 10–20 seconds.
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button
              className="flex-1"
              onClick={() => generateMutation.mutate()}
              loading={generateMutation.isPending}
              disabled={!topic.trim()}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Generate Workshop
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function WorkshopRow({
  workshop,
  isTemplate,
  onEdit,
  onPreview,
  onClone,
  onDelete,
}: {
  workshop: Workshop
  isTemplate: boolean
  onEdit: () => void
  onPreview: () => void
  onClone: () => void
  onDelete: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  const verticalColors: Record<string, string> = {
    security: 'danger',
    compliance: 'warning',
    onboarding: 'success',
    sales: 'info',
    customer_ed: 'purple',
    general: 'default',
  }

  return (
    <Card className="flex items-center gap-4 py-4">
      {/* Icon */}
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-slate-100">
        <BookOpen className="h-5 w-5 text-brand" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-text-primary truncate">{workshop.title}</p>
          <Badge variant={verticalColors[workshop.vertical] as never || 'default'}>
            {workshop.vertical}
          </Badge>
          {workshop.isPublished ? (
            <Badge variant="success">Published</Badge>
          ) : (
            <Badge variant="outline">Draft</Badge>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-3 text-[11px] text-text-muted">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {workshop.estimatedMinutes} min
          </span>
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3" />
            {workshop.totalPoints} pts
          </span>
          <span>{workshop.steps?.length ?? 0} steps</span>
          <span>{formatDate(workshop.createdAt)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button variant="ghost" size="sm" onClick={onPreview}>
          <Eye className="h-3.5 w-3.5" />
        </Button>
        {isTemplate ? (
          <Button variant="secondary" size="sm" onClick={onClone}>
            <Copy className="h-3.5 w-3.5" /> Use Template
          </Button>
        ) : (
          <Button variant="secondary" size="sm" onClick={onEdit}>
            <Edit2 className="h-3.5 w-3.5" /> Edit
          </Button>
        )}
        {!isTemplate && (
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5 text-danger" />
          </Button>
        )}
      </div>
    </Card>
  )
}
