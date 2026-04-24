import { LearnerSidebar } from '@/components/layout/learner-sidebar'

export default function LearnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full">
      <LearnerSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  )
}
