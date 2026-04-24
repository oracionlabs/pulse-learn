'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Topbar } from '@/components/layout/topbar'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { UserX, Shield, User, Users, X, Mail } from 'lucide-react'

interface OrgUser {
  _id: string
  name: string
  email: string
  role: string
  status: string
  createdAt: string
  ssoProvider?: string
}

const roleBadge: Record<string, React.ReactElement> = {
  org_admin: <Badge variant="purple">Admin</Badge>,
  manager: <Badge variant="info">Manager</Badge>,
  learner: <Badge variant="default">Learner</Badge>,
}

const statusBadge: Record<string, React.ReactElement> = {
  active: <Badge variant="success">Active</Badge>,
  invited: <Badge variant="warning">Invited</Badge>,
  deactivated: <Badge variant="danger">Deactivated</Badge>,
}

export default function UsersPage() {
  const { data: session } = useSession()
  const token = session?.user?.accessToken
  const orgId = session?.user?.orgId
  const qc = useQueryClient()

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [showInvite, setShowInvite] = useState(false)

  const { data: users = [], isLoading } = useQuery<OrgUser[]>({
    queryKey: ['org-users', orgId, search, roleFilter, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (roleFilter) params.set('role', roleFilter)
      if (statusFilter) params.set('status', statusFilter)
      const qs = params.toString()
      return api.get(`/orgs/${orgId}/users${qs ? `?${qs}` : ''}`, token)
    },
    enabled: !!token && !!orgId,
  })

  const deactivateMutation = useMutation<unknown, Error, string>({
    mutationFn: (userId) => api.delete(`/orgs/${orgId}/users/${userId}`, token),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['org-users'] }),
  })

  const roleFilters = [
    { value: '', label: 'All Roles', icon: Users },
    { value: 'org_admin', label: 'Admin', icon: Shield },
    { value: 'manager', label: 'Manager', icon: User },
    { value: 'learner', label: 'Learner', icon: User },
  ]

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <Topbar title="Users" action={{ label: 'Invite User', onClick: () => setShowInvite(true) }} />

      <main className="flex-1 p-6 space-y-4">
        {/* Filters row */}
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-[var(--radius-md)] border border-border bg-white px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 w-56"
          />

          <div className="flex items-center gap-2">
            {roleFilters.map((r) => (
              <button
                key={r.value}
                onClick={() => setRoleFilter(r.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  roleFilter === r.value
                    ? 'bg-brand text-white'
                    : 'bg-border/50 text-text-muted hover:bg-border'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {['active', 'invited', 'deactivated', ''].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? 'bg-brand text-white'
                    : 'bg-border/50 text-text-muted hover:bg-border'
                }`}
              >
                {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Count */}
        <p className="text-xs text-text-muted">
          {users.length} user{users.length !== 1 ? 's' : ''}
        </p>

        {/* Table */}
        <div className="rounded-[var(--radius-lg)] border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-[#fafafa]">
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Joined</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Auth</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-3">
                      <div className="h-4 rounded bg-border/50 animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-xs text-text-muted">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="hover:bg-[#fafafa]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={u.name} size="sm" />
                        <div>
                          <p className="text-xs font-medium text-text-primary">{u.name}</p>
                          <p className="text-[11px] text-text-muted">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{roleBadge[u.role] ?? <Badge>{u.role}</Badge>}</td>
                    <td className="px-4 py-3">{statusBadge[u.status] ?? <Badge>{u.status}</Badge>}</td>
                    <td className="px-4 py-3 text-xs text-text-muted">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3 text-xs text-text-muted capitalize">
                      {u.ssoProvider ?? 'Password'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.status === 'active' && u.role !== 'org_admin' && (
                        <button
                          onClick={() => deactivateMutation.mutate(u._id)}
                          className="rounded p-1 text-text-muted hover:text-danger hover:bg-red-50 transition-colors"
                          title="Deactivate user"
                        >
                          <UserX className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {showInvite && (
        <InviteModal
          orgId={orgId!}
          token={token!}
          onClose={() => setShowInvite(false)}
          onInvited={() => {
            setShowInvite(false)
            qc.invalidateQueries({ queryKey: ['org-users'] })
          }}
        />
      )}
    </div>
  )
}

function InviteModal({
  orgId,
  token,
  onClose,
  onInvited,
}: {
  orgId: string
  token: string
  onClose: () => void
  onInvited: () => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('learner')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      api.post<{ inviteLink: string }>(`/orgs/${orgId}/users/invite`, { name, email, role }, token),
    onSuccess: (data) => {
      setSuccess(data.inviteLink)
    },
    onError: (e: Error) => setError(e.message),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[var(--radius-xl)] bg-card border border-border shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-text-primary">Invite User</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X className="h-4 w-4" />
          </button>
        </div>

        {success ? (
          <div className="space-y-4">
            <div className="rounded-[var(--radius-md)] border border-success/20 bg-green-50 p-4">
              <p className="text-xs font-medium text-success mb-2 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                Invitation created!
              </p>
              <p className="text-[11px] text-text-muted mb-2">
                Share this link with the user (email will be sent if Resend is configured):
              </p>
              <code className="block text-[10px] bg-white border border-border rounded px-2 py-1.5 break-all text-text-primary">
                {success}
              </code>
            </div>
            <Button className="w-full" onClick={onInvited}>Done</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1.5">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-[var(--radius-md)] border border-border bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/30"
              >
                <option value="learner">Learner</option>
                <option value="manager">Manager</option>
                <option value="org_admin">Admin</option>
              </select>
            </div>
            {error && <p className="text-xs text-danger">{error}</p>}
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button
                className="flex-1"
                onClick={() => mutation.mutate()}
                loading={mutation.isPending}
                disabled={!name || !email}
              >
                Send Invite
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
