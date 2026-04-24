'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Zap } from 'lucide-react'

const schema = z
  .object({
    password: z.string().min(8, 'At least 8 characters'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  })

type FormData = z.infer<typeof schema>

function InviteForm() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token') ?? ''
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/accept-invite`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, password: data.password }),
        },
      )
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.message ?? 'Failed to accept invite')
      }
      // Sign in with the new password — we need the email too
      // Redirect to login for now
      router.push('/login?invited=1')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    }
  }

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-sm text-danger">Invalid invite link.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="New password"
        type="password"
        placeholder="At least 8 characters"
        error={errors.password?.message}
        {...register('password')}
      />
      <Input
        label="Confirm password"
        type="password"
        placeholder="Repeat password"
        error={errors.confirm?.message}
        {...register('confirm')}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
      <Button type="submit" className="w-full" loading={isSubmitting}>
        Set password & join
      </Button>
    </form>
  )
}

export default function InvitePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-brand shadow-md mb-4">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-text-primary">You&apos;re invited!</h1>
          <p className="mt-1 text-sm text-text-muted">Set a password to activate your account.</p>
        </div>
        <div className="rounded-[var(--radius-xl)] border border-border bg-card p-6 shadow-sm">
          <Suspense fallback={<div className="h-32 animate-pulse rounded bg-border/40" />}>
            <InviteForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
