export type OrgPlan = 'free' | 'starter' | 'pro' | 'enterprise'
export type OrgVertical = 'security' | 'compliance' | 'onboarding' | 'sales' | 'customer_ed'

export interface Organization {
  _id: string
  name: string
  slug: string
  domain?: string
  logo_url?: string
  plan: OrgPlan
  verticals: OrgVertical[]
  settings: {
    ssoProvider: 'none' | 'google' | 'microsoft' | 'okta'
    defaultTimezone: string
    brandColor: string
    customDomain?: string
    workshopReminders: boolean
    leaderboardEnabled: boolean
  }
  createdAt: string
  updatedAt: string
}
