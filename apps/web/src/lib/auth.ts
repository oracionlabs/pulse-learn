import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

const API_URL = process.env.API_URL || 'http://localhost:3001'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })

          if (!res.ok) return null

          const data = await res.json()
          return {
            id: data.user._id,
            email: data.user.email,
            name: data.user.name,
            image: data.user.avatar_url ?? null,
            role: data.user.role,
            orgId: data.user.orgId,
            accessToken: data.access_token,
          }
        } catch {
          return null
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken
        token.role = user.role
        token.orgId = user.orgId
      }
      return token
    },
    session({ session, token }) {
      session.user.accessToken = token.accessToken as string
      session.user.role = token.role as string
      session.user.orgId = token.orgId as string
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: { strategy: 'jwt' },
})
