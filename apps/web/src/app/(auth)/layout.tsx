import { Zap } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[420px] flex-col bg-sidebar p-10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-brand shadow-sm">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-bold text-white tracking-tight">Pulse</span>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <p className="text-2xl font-bold text-white leading-snug">
            Short workshops<br />that actually stick.
          </p>
          <p className="mt-3 text-sm text-sidebar-muted leading-relaxed">
            Train your entire team in 5 minutes a day. Chat-driven workshops for security, compliance, onboarding, and more.
          </p>

          {/* Social proof */}
          <div className="mt-10 space-y-4">
            {[
              { stat: '73%', label: 'avg completion rate' },
              { stat: '5 min', label: 'avg workshop length' },
              { stat: '84%', label: 'avg quiz score' },
            ].map((item) => (
              <div key={item.stat} className="flex items-center gap-3">
                <span className="text-lg font-bold text-white">{item.stat}</span>
                <span className="text-sm text-sidebar-muted">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-white/20">© 2025 Pulse. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>
    </div>
  )
}
