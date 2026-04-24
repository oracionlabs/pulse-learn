'use client'

import { useSession } from 'next-auth/react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Topbar } from '@/components/layout/topbar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { Check, Zap } from 'lucide-react'

interface BillingInfo {
  plan: string
  subscription: {
    status?: string
    stripeCustomerId?: string
    currentPeriodEnd?: string
  } | null
}

const PLANS = [
  {
    key: 'starter',
    name: 'Starter',
    price: '$49',
    period: '/mo',
    description: 'Perfect for small teams up to 25 learners.',
    features: ['25 active learners', '10 workshops', 'Basic analytics', 'Email support'],
  },
  {
    key: 'growth',
    name: 'Growth',
    price: '$149',
    period: '/mo',
    description: 'Scale your learning programs.',
    features: ['100 active learners', 'Unlimited workshops', 'Advanced analytics', 'AI generator', 'Priority support'],
    popular: true,
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large organizations with custom needs.',
    features: ['Unlimited learners', 'SSO / SAML', 'Custom branding', 'SLA', 'Dedicated CSM'],
  },
]

export default function BillingPage() {
  const { data: session } = useSession()
  const token = session?.user?.accessToken
  const orgId = session?.user?.orgId

  const { data: billing, isLoading } = useQuery<BillingInfo>({
    queryKey: ['billing', orgId],
    queryFn: () => api.get(`/orgs/${orgId}/billing`, token),
    enabled: !!token && !!orgId,
  })

  const checkoutMutation = useMutation({
    mutationFn: (plan: string) =>
      api.post<{ url: string; mock?: boolean }>(`/orgs/${orgId}/billing/checkout`, {
        plan,
        returnUrl: window.location.href,
      }, token),
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url
    },
  })

  const currentPlan = billing?.plan ?? 'free'

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <Topbar title="Billing" />

      <main className="flex-1 p-6 space-y-8">
        {/* Current plan banner */}
        <div className="rounded-[var(--radius-lg)] border border-border bg-slate-50 px-6 py-4 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-brand/10">
            <Zap className="h-5 w-5 text-brand" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">
              Current plan:{' '}
              <span className="capitalize">{isLoading ? '—' : currentPlan}</span>
            </p>
            {billing?.subscription?.status && (
              <p className="text-xs text-text-muted mt-0.5">
                Status: <span className="capitalize">{billing.subscription.status}</span>
                {billing.subscription.currentPeriodEnd && (
                  <> · Renews {new Date(billing.subscription.currentPeriodEnd).toLocaleDateString()}</>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.key
            return (
              <div
                key={plan.key}
                className={`relative rounded-[var(--radius-xl)] border p-6 flex flex-col ${
                  plan.popular
                    ? 'border-brand shadow-lg shadow-brand/10'
                    : 'border-border'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="default" className="bg-brand text-white text-[10px]">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-base font-semibold text-text-primary">{plan.name}</h3>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-text-primary">{plan.price}</span>
                    <span className="text-sm text-text-muted">{plan.period}</span>
                  </div>
                  <p className="mt-2 text-xs text-text-muted">{plan.description}</p>
                </div>

                <ul className="flex-1 space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-text-primary">
                      <Check className="h-3.5 w-3.5 text-success flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <Button variant="secondary" disabled className="w-full">
                    Current Plan
                  </Button>
                ) : plan.key === 'enterprise' ? (
                  <Button variant="secondary" className="w-full">
                    Contact Sales
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => checkoutMutation.mutate(plan.key)}
                    loading={checkoutMutation.isPending && checkoutMutation.variables === plan.key}
                  >
                    Upgrade to {plan.name}
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
