'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Topbar } from '@/components/layout/topbar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import {
  Plus,
  Trash2,
  AlertCircle,
  Clock,
  Users,
  User,
  CheckCircle2,
  X,
} from 'lucide-react'

interface Workshop {
  _id: string
  title: string
  vertical: string
  estimatedMinutes: number
}

interface Assignment {
  _id: string
  workshopId: { _id: string; title: string; vertical: string } | null
  assignedTo: { type: 'user' | 'org'; id: string | null }
  assignedBy: string
  dueDate?: string
  priority: 'required' | 'recommended' | 'optional'
  status: string
  createdAt: string
}

const statusBadge: Record<string, React.ReactElement> = {
  pending: <Badge variant="default">Pending</Badge>,
  in_progress: <Badge variant="info">In Progress</Badge>,
  completed: <Badge variant="success">Completed</Badge>,
  overdue: <Badge variant="danger">Overdue</Badge>,
}

const priorityBadge: Record<string, React.ReactElement> = {
  required: <Badge variant="danger">Required</Badge>,
  recommended: <Badge variant="warning">Recommended</Badge>,
  optional: <Badge variant="outline">Optional</Badge>,
}

export default function AssignmentsPage() {
  const { data: session } = useSession()
  const token = session?.user?.accessToken
  const orgId = session?.user?.orgId
  const qc = useQueryClient()

  const [statusFilter, setStatusFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const { data: assignments = [], isLoading } = useQuery<Assignment[]>({
    queryKey: ['assignments', orgId, statusFilter],
    queryFn: () => {
      const params = statusFilter ? `?status=${statusFilter}` : ''
      return api.get(`/orgs/${orgId}/assignments${params}`, token)
    },
    enabled: !!token && !!orgId,
  })

  const { data: workshops = [] } = useQuery<Workshop[]>({
    queryKey: ['org-workshops', orgId],
    queryFn: () => api.get(`/orgs/${orgId}/workshops`, token),
    enabled: !!token && !!orgId,
  })

  const deleteMutation = useMutation<unknown, Error, string>({
    mutationFn: (id) => api.delete(`/orgs/${orgId}/assignments/${id}`, token),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assignments'] }),
  })

  const filters = ['', 'pending', 'in_progress', 'overdue', 'completed']
  const filterLabels: Record<string, string> = {
    '': 'All',
    pending: 'Pending',
    in_progress: 'In Progress',
    overdue: 'Overdue',
    completed: 'Completed',
  }

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <Topbar
        title="Assignments"
        action={{ label: 'New Assignment', onClick: () => setShowCreate(true) }}
      />

      <main className="flex-1 p-6 space-y-4">
        {/* Filter tabs */}
        <div className="flex items-center gap-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === f
                  ? 'bg-brand text-white'
                  : 'bg-border/50 text-text-muted hover:bg-border'
              }`}
            >
              {filterLabels[f]}
            </button>
          ))}
          <span className="ml-auto text-xs text-text-muted">
            {assignments.length} assignment{assignments.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table */}
        <div className="rounded-[var(--radius-lg)] border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-[#fafafa]">
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Workshop</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Assigned To</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Due Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-3">
                      <div className="h-4 rounded bg-border/50 animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : assignments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-xs text-text-muted">
                    No assignments found.
                  </td>
                </tr>
              ) : (
                assignments.map((a) => (
                  <tr key={a._id} className="hover:bg-[#fafafa]">
                    <td className="px-4 py-3">
                      <p className="font-medium text-text-primary text-xs">
                        {a.workshopId?.title ?? '—'}
                      </p>
                      {a.workshopId?.vertical && (
                        <p className="text-[11px] text-text-muted capitalize">
                          {a.workshopId.vertical.replace('_', ' ')}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs text-text-muted">
                        {a.assignedTo.type === 'org' ? (
                          <>
                            <Users className="h-3.5 w-3.5" />
                            <span>All members</span>
                          </>
                        ) : (
                          <>
                            <User className="h-3.5 w-3.5" />
                            <span>{String(a.assignedTo.id ?? '—')}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">{priorityBadge[a.priority]}</td>
                    <td className="px-4 py-3">
                      {a.dueDate ? (
                        <span
                          className={`flex items-center gap-1 text-xs ${
                            a.status === 'overdue' ? 'text-danger font-medium' : 'text-text-muted'
                          }`}
                        >
                          {a.status === 'overdue' && <AlertCircle className="h-3 w-3" />}
                          <Clock className="h-3 w-3" />
                          {formatDate(a.dueDate)}
                        </span>
                      ) : (
                        <span className="text-xs text-text-muted">No deadline</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{statusBadge[a.status] ?? <Badge>{a.status}</Badge>}</td>
                    <td className="px-4 py-3 text-right">
                      {a.status !== 'completed' && (
                        <button
                          onClick={() => deleteMutation.mutate(a._id)}
                          className="rounded p-1 text-text-muted hover:text-danger hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {a.status === 'completed' && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-success mx-1" />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Create modal */}
      {showCreate && (
        <CreateAssignmentModal
          orgId={orgId!}
          token={token!}
          workshops={workshops}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false)
            qc.invalidateQueries({ queryKey: ['assignments'] })
          }}
        />
      )}
    </div>
  )
}

function CreateAssignmentModal({
  orgId,
  token,
  workshops,
  onClose,
  onCreated,
}: {
  orgId: string
  token: string
  workshops: Workshop[]
  onClose: () => void
  onCreated: () => void
}) {
  const [workshopId, setWorkshopId] = useState('')
  const [assignType, setAssignType] = useState<'org' | 'user'>('org')
  const [userId, setUserId] = useState('')
  const [priority, setPriority] = useState('required')
  const [dueDate, setDueDate] = useState('')
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      api.post(`/orgs/${orgId}/assignments`, {
        workshopId,
        assignedTo: { type: assignType, id: assignType === 'org' ? orgId : userId },
        priority,
        dueDate: dueDate || undefined,
      }, token),
    onSuccess: onCreated,
    onError: (e: Error) => setError(e.message),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[var(--radius-xl)] bg-card border border-border shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-text-primary">New Assignment</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Workshop */}
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1.5">Workshop</label>
            <select
              value={workshopId}
              onChange={(e) => setWorkshopId(e.target.value)}
              className="w-full rounded-[var(--radius-md)] border border-border bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              <option value="">Select a workshop…</option>
              {workshops.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.title}
                </option>
              ))}
            </select>
          </div>

          {/* Assign to */}
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1.5">Assign to</label>
            <div className="flex gap-2">
              {(['org', 'user'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setAssignType(t)}
                  className={`flex-1 rounded-[var(--radius-md)] border py-2 text-xs font-medium transition-colors ${
                    assignType === t
                      ? 'border-brand bg-brand/5 text-brand'
                      : 'border-border text-text-muted hover:border-brand/40'
                  }`}
                >
                  {t === 'org' ? 'All Members' : 'Specific User'}
                </button>
              ))}
            </div>
            {assignType === 'user' && (
              <Input
                className="mt-2"
                placeholder="User ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1.5">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full rounded-[var(--radius-md)] border border-border bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              <option value="required">Required</option>
              <option value="recommended">Recommended</option>
              <option value="optional">Optional</option>
            </select>
          </div>

          {/* Due date */}
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1.5">
              Due date <span className="text-text-muted font-normal">(optional)</span>
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-[var(--radius-md)] border border-border bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>

          {error && (
            <p className="text-xs text-danger">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <Button variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={() => mutation.mutate()}
              loading={mutation.isPending}
              disabled={!workshopId}
            >
              Create
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
