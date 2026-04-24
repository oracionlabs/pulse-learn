'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  orgName: z.string().min(2, 'Organization name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setError('')
    try {
      await api.post('/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
        orgName: data.orgName,
      })

      // Auto-login after register
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        setError('Account created but login failed. Please sign in.')
        router.push('/login')
        return
      }

      router.push('/dashboard')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setError(message)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary">Create your account</h1>
      <p className="mt-1.5 text-sm text-text-secondary">
        Start training your team in minutes
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <Input
          label="Your name"
          placeholder="Jane Smith"
          error={errors.name?.message}
          {...register('name')}
        />
        <Input
          label="Work email"
          type="email"
          placeholder="jane@company.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Organization name"
          placeholder="Acme Corp"
          error={errors.orgName?.message}
          {...register('orgName')}
        />
        <Input
          label="Password"
          type="password"
          placeholder="8+ characters"
          error={errors.password?.message}
          {...register('password')}
        />

        {error && (
          <p className="rounded-[var(--radius-md)] bg-red-50 px-3 py-2 text-xs text-danger">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-text-muted">
        Already have an account?{' '}
        <Link href="/login" className="text-brand hover:underline font-medium">
          Sign in
        </Link>
      </p>

      <p className="mt-4 text-center text-[10px] text-text-muted">
        By creating an account you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  )
}
