'use client'

import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { Topbar } from '@/components/layout/topbar'
import { Avatar } from '@/components/ui/avatar'
import { api } from '@/lib/api'
import { Trophy, Star, CheckCircle2 } from 'lucide-react'

interface LeaderboardEntry {
  userId: string
  name: string
  email: string
  totalScore: number
  sessionsCompleted: number
  avgScore: number
}

const medalColors = ['text-amber-400', 'text-gray-400', 'text-amber-600']
const medalBg = ['bg-amber-50', 'bg-gray-50', 'bg-amber-50/60']

export default function LeaderboardPage() {
  const { data: session } = useSession()
  const token = session?.user?.accessToken
  const orgId = session?.user?.orgId

  const { data: entries = [], isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ['leaderboard', orgId],
    queryFn: () => api.get(`/orgs/${orgId}/leaderboard?limit=50`, token),
    enabled: !!token && !!orgId,
  })

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <Topbar title="Leaderboard" />

      <main className="flex-1 p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Top 3 podium */}
          {!isLoading && entries.length >= 3 && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[entries[1], entries[0], entries[2]].map((entry, podiumIdx) => {
                const rank = podiumIdx === 0 ? 2 : podiumIdx === 1 ? 1 : 3
                const heights = ['h-24', 'h-32', 'h-20']
                return (
                  <div
                    key={entry.userId}
                    className={`flex flex-col items-center justify-end rounded-[var(--radius-lg)] border border-border ${medalBg[rank - 1]} p-4 ${heights[podiumIdx]}`}
                  >
                    <Avatar name={entry.name} size="md" />
                    <p className="mt-2 text-xs font-semibold text-text-primary text-center truncate w-full">
                      {entry.name}
                    </p>
                    <div className={`flex items-center gap-1 ${medalColors[rank - 1]}`}>
                      <Trophy className="h-3 w-3" />
                      <span className="text-xs font-bold">{entry.totalScore} pts</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Full list */}
          <div className="rounded-[var(--radius-lg)] border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-[#fafafa]">
                  <th className="w-12 px-4 py-3 text-left text-xs font-medium text-text-muted">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Learner</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-muted">
                    <div className="flex items-center justify-end gap-1">
                      <Star className="h-3 w-3" />Points
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-muted">
                    <div className="flex items-center justify-end gap-1">
                      <CheckCircle2 className="h-3 w-3" />Completed
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-muted">Avg %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={5} className="px-4 py-3">
                        <div className="h-4 rounded bg-border/50 animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-xs text-text-muted">
                      No completions yet. Assign workshops to get started.
                    </td>
                  </tr>
                ) : (
                  entries.map((entry, idx) => (
                    <tr
                      key={entry.userId}
                      className={`hover:bg-[#fafafa] ${idx < 3 ? 'font-medium' : ''}`}
                    >
                      <td className="w-12 px-4 py-3">
                        {idx < 3 ? (
                          <Trophy className={`h-4 w-4 ${medalColors[idx]}`} />
                        ) : (
                          <span className="text-xs text-text-muted">{idx + 1}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={entry.name} size="sm" />
                          <div>
                            <p className="text-xs font-medium text-text-primary">{entry.name}</p>
                            <p className="text-[11px] text-text-muted">{entry.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-xs font-semibold text-text-primary">
                          {entry.totalScore}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-text-muted">
                        {entry.sessionsCompleted}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-text-muted">
                        {entry.avgScore}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
