import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface User {
    role?: string
    orgId?: string
    accessToken?: string
  }
  interface Session {
    user: {
      id: string
      email: string
      name: string
      image?: string
      role: string
      orgId: string
      accessToken: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string
    orgId?: string
    accessToken?: string
  }
}
