'use client'

import { SessionProvider, useSession } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider as ReduxProvider } from 'react-redux'
import { store } from '@/store'
import { useState, useEffect } from 'react'
import { initPostHog, identify } from '@/lib/posthog'

function PostHogIdentifier() {
  const { data: session } = useSession()
  useEffect(() => {
    initPostHog()
    if (session?.user) {
      identify(session.user.id ?? '', {
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        orgId: session.user.orgId,
      })
    }
  }, [session])
  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      }),
  )

  return (
    <SessionProvider>
      <ReduxProvider store={store}>
        <QueryClientProvider client={queryClient}>
          <PostHogIdentifier />
          {children}
        </QueryClientProvider>
      </ReduxProvider>
    </SessionProvider>
  )
}
