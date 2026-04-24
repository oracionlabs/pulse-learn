'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Topbar } from '@/components/layout/topbar'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { Users, Plus, Pencil, Trash2, ChevronRight, X } from 'lucide-react'

interface Department {
  _id: string
  name: string
  memberCount: number
  managerId?: { _id: string; name: string; email: string } | null
  parentDepartmentId?: string | null
}

export default function DepartmentsPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const token = session?.user?.accessToken
  const orgId = session?.user?.orgId

  const [showAdd, setShowAdd] = useState(false)
  const [editDept, setEditDept] = useState<Department | null>(null)
  const [form, setForm] = useState({ name: '' })

  const { data: departments = [], isLoading } = useQuery<Department[]>({
    queryKey: ['departments', orgId],
    queryFn: () => api.get(`/orgs/${orgId}/departments`, token),
    enabled: !!orgId,
  })

  const createMutation = useMutation({
    mutationFn: () => api.post(`/orgs/${orgId}/departments`, form, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments', orgId] })
      setShowAdd(false)
      setForm({ name: '' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (dept: Department) =>
      api.put(`/orgs/${orgId}/departments/${dept._id}`, { name: form.name }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments', orgId] })
      setEditDept(null)
      setForm({ name: '' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/orgs/${orgId}/departments/${id}`, token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['departments', orgId] }),
  })

  function openEdit(dept: Department) {
    setEditDept(dept)
    setForm({ name: dept.name })
  }

  function closeModal() {
    setShowAdd(false)
    setEditDept(null)
    setForm({ name: '' })
  }

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <Topbar
        title="Departments"
        action={{ label: 'New Department', onClick: () => setShowAdd(true) }}
      />
      <main className="flex-1 p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          </div>
        ) : departments.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-10 w-10 text-text-muted mb-3" />
            <p className="text-sm font-medium text-text-primary">No departments yet</p>
            <p className="text-xs text-text-muted mt-1 mb-4">Create departments to organise your team.</p>
            <Button size="sm" onClick={() => setShowAdd(true)}>
              <Plus className="h-3.5 w-3.5" /> New Department
            </Button>
          </Card>
        ) : (
          <div className="space-y-2">
            {departments.map((dept) => (
              <Card key={dept._id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10">
                    <Users className="h-4 w-4 text-brand" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{dept.name}</p>
                    <p className="text-xs text-text-muted">
                      {dept.memberCount} member{dept.memberCount !== 1 ? 's' : ''}
                      {dept.managerId ? ` · Manager: ${dept.managerId.name}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(dept)}
                    aria-label="Edit department"
                    className="rounded-lg p-2 text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(dept._id)}
                    aria-label="Delete department"
                    className="rounded-lg p-2 text-text-secondary hover:bg-surface-hover hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <ChevronRight className="h-4 w-4 text-text-muted" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Add / Edit modal */}
      {(showAdd || editDept) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-text-primary">
                {editDept ? 'Edit Department' : 'New Department'}
              </h2>
              <button onClick={closeModal} className="rounded-lg p-1 hover:bg-surface-hover">
                <X className="h-4 w-4 text-text-secondary" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1 block">Name</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ name: e.target.value })}
                  placeholder="e.g. Engineering"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (editDept) updateMutation.mutate(editDept)
                      else createMutation.mutate()
                    }
                  }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <Button variant="secondary" onClick={closeModal}>Cancel</Button>
              <Button
                loading={createMutation.isPending || updateMutation.isPending}
                onClick={() => {
                  if (editDept) updateMutation.mutate(editDept)
                  else createMutation.mutate()
                }}
              >
                {editDept ? 'Save' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
