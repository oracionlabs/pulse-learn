import { LearnerSidebar } from '@/components/layout/learner-sidebar'
import { MobileLearnerNav } from '@/components/layout/mobile-learner-nav'

export default function LearnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full">
      <LearnerSidebar />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <div className="flex-1 overflow-auto pb-16 md:pb-0">
          {children}
        </div>
      </div>
      <MobileLearnerNav />
    </div>
  )
}
