export type UserRole = 'super_admin' | 'org_admin' | 'manager' | 'learner'
export type UserStatus = 'active' | 'invited' | 'deactivated'
export type SSOProvider = 'none' | 'google' | 'microsoft' | 'okta'

export interface User {
  _id: string
  orgId: string
  email: string
  name: string
  avatar_url?: string
  role: UserRole
  department?: string
  title?: string
  ssoId?: string
  ssoProvider?: SSOProvider
  status: UserStatus
  lastLoginAt?: string
  invitedBy?: string
  invitedAt?: string
  createdAt: string
  updatedAt: string
}
