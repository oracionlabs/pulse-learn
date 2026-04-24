export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ORG_ADMIN: 'org_admin',
  MANAGER: 'manager',
  LEARNER: 'learner',
} as const

export const PLAN_LIMITS = {
  free: { users: 10, workshops: 3, aiGenerations: 0 },
  starter: { users: 50, workshops: Infinity, aiGenerations: 10 },
  pro: { users: 200, workshops: Infinity, aiGenerations: Infinity },
  enterprise: { users: Infinity, workshops: Infinity, aiGenerations: Infinity },
} as const
