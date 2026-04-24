'use client'

import { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Topbar } from '@/components/layout/topbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { Check, Upload, RefreshCw } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface OrgSettings {
  _id: string
  name: string
  slug: string
  domain?: string
  logo_url?: string
  plan: string
  verticals: string[]
  settings: Record<string, unknown>
}

interface SyncResult {
  provider: string
  added: string[]
  updated: string[]
  deactivated: string[]
  total: number
}

const VERTICALS = [
  { value: 'security', label: 'Security' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'sales', label: 'Sales Enablement' },
  { value: 'customer_ed', label: 'Customer Education' },
  { value: 'general', label: 'General' },
]

export default function SettingsPage() {
  const { data: session } = useSession()
  const token = session?.user?.accessToken
  const orgId = session?.user?.orgId
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const { data: org, isLoading } = useQuery<OrgSettings>({
    queryKey: ['org-settings', orgId],
    queryFn: () => api.get(`/orgs/${orgId}`, token),
    enabled: !!token && !!orgId,
  })

  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')
  const [verticals, setVerticals] = useState<string[]>([])
  const [saved, setSaved] = useState(false)
  const [logoUrl, setLogoUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)

  const [initialized, setInitialized] = useState(false)
  if (org && !initialized) {
    setName(org.name)
    setDomain(org.domain ?? '')
    setVerticals(org.verticals ?? [])
    setLogoUrl(org.logo_url ?? '')
    setInitialized(true)
  }

  const updateMutation = useMutation({
    mutationFn: () =>
      api.put(`/orgs/${orgId}`, { name, domain, verticals, logo_url: logoUrl }, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org-settings'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  const syncMutation = useMutation({
    mutationFn: (provider: 'google' | 'microsoft') =>
      api.post<SyncResult>(`/orgs/${orgId}/sso/sync/${provider}`, {}, token),
    onSuccess: (result) => setSyncResult(result),
  })

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
      const data = await res.json()
      if (data.url) setLogoUrl(data.url)
    } finally {
      setUploading(false)
    }
  }

  const toggleVertical = (v: string) => {
    setVerticals((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v],
    )
  }

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <Topbar title="Settings" />

      <main className="flex-1 p-6">
        <div className="max-w-xl space-y-8">
          {/* Organization info */}
          <section>
            <h2 className="text-sm font-semibold text-text-primary mb-4">Organization</h2>
            <div className="rounded-[var(--radius-lg)] border border-border bg-card p-6 space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-10 rounded bg-border/50 animate-pulse" />
                  ))}
                </div>
              ) : (
                <>
                  {/* Logo upload */}
                  <div>
                    <label className="block text-xs font-medium text-text-primary mb-2">Logo</label>
                    <div className="flex items-center gap-3">
                      {logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={logoUrl} alt="Org logo" className="h-12 w-12 rounded-lg object-cover border border-border" />
                      ) : (
                        <div className="h-12 w-12 rounded-lg border border-dashed border-border bg-surface flex items-center justify-center">
                          <Upload className="h-4 w-4 text-text-muted" />
                        </div>
                      )}
                      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                      <Button size="sm" variant="secondary" loading={uploading} onClick={() => fileRef.current?.click()}>
                        {uploading ? 'Uploading…' : 'Upload logo'}
                      </Button>
                    </div>
                  </div>

                  <Input
                    label="Organization name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <Input
                    label="Domain"
                    placeholder="example.com"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                  />
                  <div>
                    <label className="block text-xs font-medium text-text-primary mb-1.5">
                      Plan
                    </label>
                    <div className="rounded-[var(--radius-md)] border border-border bg-[#fafafa] px-3 py-2 text-sm text-text-muted capitalize">
                      {org?.plan ?? '—'}
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Content verticals */}
          <section>
            <h2 className="text-sm font-semibold text-text-primary mb-1">Content Verticals</h2>
            <p className="text-xs text-text-muted mb-4">
              Select the training categories your organization uses.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {VERTICALS.map((v) => {
                const active = verticals.includes(v.value)
                return (
                  <button
                    key={v.value}
                    onClick={() => toggleVertical(v.value)}
                    aria-pressed={active}
                    className={`flex items-center gap-2.5 rounded-[var(--radius-md)] border px-3 py-2.5 text-sm text-left transition-colors ${
                      active
                        ? 'border-brand bg-brand/5 text-brand'
                        : 'border-border text-text-muted hover:border-brand/30'
                    }`}
                  >
                    <div
                      className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors ${
                        active ? 'border-brand bg-brand' : 'border-border'
                      }`}
                    >
                      {active && <Check className="h-2.5 w-2.5 text-white" />}
                    </div>
                    {v.label}
                  </button>
                )
              })}
            </div>
          </section>

          <Button
            onClick={() => updateMutation.mutate()}
            loading={updateMutation.isPending}
            disabled={isLoading}
          >
            {saved ? (
              <>
                <Check className="h-4 w-4" /> Saved
              </>
            ) : (
              'Save changes'
            )}
          </Button>

          {/* SSO Sync */}
          <section>
            <h2 className="text-sm font-semibold text-text-primary mb-1">Directory Sync</h2>
            <p className="text-xs text-text-muted mb-4">
              Import users from your identity provider. New users are added, removed users are deactivated, changed names and emails are updated.
            </p>
            <div className="rounded-[var(--radius-lg)] border border-border bg-card p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">Google Workspace</p>
                  <p className="text-xs text-text-muted">Sync users from Google Admin</p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  loading={syncMutation.isPending}
                  onClick={() => syncMutation.mutate('google')}
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Sync now
                </Button>
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">Microsoft 365</p>
                  <p className="text-xs text-text-muted">Sync users from Azure AD / Entra</p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  loading={syncMutation.isPending}
                  onClick={() => syncMutation.mutate('microsoft')}
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Sync now
                </Button>
              </div>

              {syncResult && (
                <div className="mt-2 rounded-[var(--radius-md)] bg-green-50 border border-green-200 p-3 text-xs text-green-800">
                  <p className="font-medium capitalize">{syncResult.provider} sync complete</p>
                  <p className="mt-1">
                    {syncResult.added.length} added · {syncResult.updated.length} updated · {syncResult.deactivated.length} deactivated · {syncResult.total} total
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
