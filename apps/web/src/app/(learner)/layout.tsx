import { LearnerSidebar } from '@/components/layout/learner-sidebar'
import { MobileLearnerNav } from '@/components/layout/mobile-learner-nav'

export default function LearnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full">
      <LearnerSidebar />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0 h-full">
        <div className="flex-1 overflow-auto">
          {children}
        </div>
        <MobileLearnerNav />
      </div>
    </div>
  )
}
