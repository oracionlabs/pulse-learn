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

export default function LearnerLeaderboardPage() {
  const { data: session } = useSession()
  const token = session?.user?.accessToken
  const orgId = session?.user?.orgId
  const myId = (session?.user as { id?: string })?.id

  const { data: entries = [], isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ['leaderboard', orgId],
    queryFn: () => api.get(`/orgs/${orgId}/leaderboard?limit=50`, token),
    enabled: !!token && !!orgId,
  })

  const myRank = entries.findIndex((e) => e.userId === myId) + 1

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <Topbar title="Leaderboard" />

      <main className="flex-1 p-6">
        <div className="max-w-lg mx-auto space-y-4">
          {myRank > 0 && (
            <div className="rounded-[var(--radius-lg)] border border-border bg-slate-50 px-4 py-3 text-sm text-brand">
              You&apos;re ranked <span className="font-bold">#{myRank}</span> with{' '}
              <span className="font-bold">{entries[myRank - 1]?.totalScore} pts</span>
            </div>
          )}

          <div className="rounded-[var(--radius-lg)] border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-[#fafafa]">
                  <th className="w-10 px-4 py-3 text-left text-xs font-medium text-text-muted">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Learner</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-muted">
                    <Star className="h-3 w-3 inline mr-0.5" />Pts
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-muted">
                    <CheckCircle2 className="h-3 w-3 inline mr-0.5" />Done
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={4} className="px-4 py-3">
                        <div className="h-4 rounded bg-border/50 animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-xs text-text-muted">
                      No results yet — complete a workshop to appear here!
                    </td>
                  </tr>
                ) : (
                  entries.map((entry, idx) => {
                    const isMe = entry.userId === myId
                    return (
                      <tr
                        key={entry.userId}
                        className={`${isMe ? 'bg-blue-50/50' : 'hover:bg-[#fafafa]'}`}
                      >
                        <td className="w-10 px-4 py-3">
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
                              <p className={`text-xs font-medium ${isMe ? 'text-brand' : 'text-text-primary'}`}>
                                {entry.name} {isMe && '(you)'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-semibold text-text-primary">
                          {entry.totalScore}
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-text-muted">
                          {entry.sessionsCompleted}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
