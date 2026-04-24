import Link from 'next/link'
import {
  Zap,
  Trophy,
  BarChart3,
  Brain,
  Shield,
  Users,
  CheckCircle2,
  ArrowRight,
  Star,
} from 'lucide-react'

const features = [
  {
    icon: Zap,
    title: '5-Minute Workshops',
    desc: 'Micro-learning that fits in the flow of work. No hour-long slideshows.',
  },
  {
    icon: Brain,
    title: 'AI Content Generation',
    desc: 'Describe a topic — AI builds a complete workshop with quizzes and scenarios.',
  },
  {
    icon: Trophy,
    title: 'Leaderboards & Badges',
    desc: 'Friendly competition and earned badges keep learners coming back.',
  },
  {
    icon: BarChart3,
    title: 'Real-Time Reporting',
    desc: 'Completion rates, scores, drop-off by step — export everything to CSV.',
  },
  {
    icon: Shield,
    title: 'Compliance Ready',
    desc: 'Audit trails, completion certificates, and overdue tracking built in.',
  },
  {
    icon: Users,
    title: 'Multi-Tenant Teams',
    desc: 'Departments, roles, SSO — built for organisations of all sizes.',
  },
]

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '',
    desc: 'Try Pulse with your team',
    features: ['10 users', '3 workshops', 'Basic reporting', 'Leaderboard'],
    cta: 'Get started free',
    href: '/register',
    highlight: false,
  },
  {
    name: 'Starter',
    price: '$49',
    period: '/month',
    desc: 'For growing teams',
    features: ['50 users', 'Unlimited workshops', 'Full reporting', 'CSV export', 'Email support'],
    cta: 'Start free trial',
    href: '/register',
    highlight: true,
  },
  {
    name: 'Pro',
    price: '$149',
    period: '/month',
    desc: 'For serious L&D teams',
    features: [
      '200 users',
      'AI generator',
      'Custom branding',
      'Priority support',
      'All Starter features',
    ],
    cta: 'Start free trial',
    href: '/register',
    highlight: false,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'Unlimited scale + SSO',
    features: ['Unlimited users', 'SSO / SAML', 'API access', 'Dedicated support', 'SLA'],
    cta: 'Contact us',
    href: 'mailto:hello@pulse.app',
    highlight: false,
  },
]

const testimonials = [
  {
    quote: 'We cut onboarding time from 2 weeks to 3 days. Learners actually finish the workshops.',
    author: 'Sarah Chen',
    role: 'Head of People Ops',
    company: 'Acme Corp',
  },
  {
    quote: "Our phishing click rate dropped 60% after running Pulse's security awareness track.",
    author: 'James Park',
    role: 'CISO',
    company: 'Meridian Health',
  },
  {
    quote: 'The AI generator let us build 20 workshops in a week. Previously that took months.',
    author: 'Priya Nair',
    role: 'Sales Enablement Lead',
    company: 'Brightfield',
  },
]

export default function LandingPage() {
  return (
    <div className="font-sans text-gray-900">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold text-brand">Pulse</span>
          <div className="hidden items-center gap-6 text-sm text-gray-600 md:flex">
            <a href="#features" className="hover:text-gray-900">Features</a>
            <a href="#pricing" className="hover:text-gray-900">Pricing</a>
            <Link href="/login" className="hover:text-gray-900">Sign in</Link>
          </div>
          <Link
            href="/register"
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark"
          >
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-white py-24 text-center">
        <div className="mx-auto max-w-3xl px-6">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-medium text-brand-dark">
            <Zap className="h-3 w-3" /> AI-powered micro-learning
          </div>
          <h1 className="mt-4 text-5xl font-extrabold leading-tight tracking-tight text-gray-900 md:text-6xl">
            Train your team in <span className="text-brand">5 minutes</span>, not 5 hours.
          </h1>
          <p className="mt-6 text-xl text-gray-500">
            Pulse turns any topic into a short, engaging workshop that employees actually finish. Built for security, compliance, onboarding, and sales teams.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="flex items-center gap-2 rounded-xl bg-brand px-8 py-3.5 text-base font-semibold text-white shadow-lg hover:bg-brand-dark"
            >
              Start for free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-gray-200 bg-white px-8 py-3.5 text-base font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Sign in
            </Link>
          </div>
          <p className="mt-4 text-xs text-gray-400">No credit card required · Free plan forever</p>
        </div>

        {/* Mock dashboard screenshot placeholder */}
        <div className="mx-auto mt-16 max-w-4xl px-6">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
            <div className="flex items-center gap-1.5 border-b border-gray-100 bg-gray-50 px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-red-400" />
              <span className="h-3 w-3 rounded-full bg-yellow-400" />
              <span className="h-3 w-3 rounded-full bg-green-400" />
              <span className="ml-4 text-xs text-gray-400">app.pulse.ai — Dashboard</span>
            </div>
            <div className="grid grid-cols-4 gap-4 p-6">
              {[
                { label: 'Active Learners', value: '142' },
                { label: 'Workshops', value: '28' },
                { label: 'Completions', value: '1,847' },
                { label: 'Avg Score', value: '87%' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-left">
                  <p className="text-xs text-gray-500">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold text-gray-900">Everything your L&D team needs</h2>
          <p className="mt-3 text-center text-gray-500">One platform for creating, assigning, and tracking micro-learning at scale.</p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                  <f.icon className="h-5 w-5 text-brand" />
                </div>
                <h3 className="font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="bg-blue-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-2xl font-bold text-gray-900">Loved by L&D teams</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.author} className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-700 italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-4">
                  <p className="text-sm font-semibold text-gray-900">{t.author}</p>
                  <p className="text-xs text-gray-500">{t.role} · {t.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold text-gray-900">Simple, transparent pricing</h2>
          <p className="mt-3 text-center text-gray-500">Start free. Upgrade when you&apos;re ready.</p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border p-6 ${
                  plan.highlight
                    ? 'border-brand bg-brand text-white shadow-xl'
                    : 'border-gray-200 bg-white text-gray-900'
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-yellow-400 px-3 py-0.5 text-xs font-bold text-gray-900">
                    Most popular
                  </span>
                )}
                <div>
                  <p className={`text-sm font-medium ${plan.highlight ? 'text-blue-200' : 'text-gray-500'}`}>{plan.name}</p>
                  <p className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold">{plan.price}</span>
                    <span className={`text-sm ${plan.highlight ? 'text-blue-200' : 'text-gray-500'}`}>{plan.period}</span>
                  </p>
                  <p className={`mt-1 text-sm ${plan.highlight ? 'text-blue-200' : 'text-gray-500'}`}>{plan.desc}</p>
                </div>
                <ul className="mt-6 flex-1 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className={`h-4 w-4 flex-shrink-0 ${plan.highlight ? 'text-blue-200' : 'text-brand'}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`mt-6 block rounded-xl py-2.5 text-center text-sm font-semibold transition-colors ${
                    plan.highlight
                      ? 'bg-white text-brand hover:bg-blue-50'
                      : 'border border-gray-200 bg-gray-50 text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand py-20 text-center text-white">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-3xl font-bold">Ready to transform how your team learns?</h2>
          <p className="mt-4 text-blue-200">Join hundreds of companies already using Pulse to upskill their teams faster.</p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-brand shadow-lg hover:bg-blue-50"
          >
            Get started for free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <span className="text-lg font-bold text-brand">Pulse</span>
            <p className="text-sm text-gray-400">© {new Date().getFullYear()} Pulse. All rights reserved.</p>
            <div className="flex gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-gray-600">Privacy</a>
              <a href="#" className="hover:text-gray-600">Terms</a>
              <a href="mailto:hello@pulse.app" className="hover:text-gray-600">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
