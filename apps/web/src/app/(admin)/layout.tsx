import { AdminSidebar } from '@/components/layout/sidebar'
import { MobileAdminNav } from '@/components/layout/mobile-admin-nav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <div className="flex-1 overflow-auto pb-16 md:pb-0">
          {children}
        </div>
      </div>
      <MobileAdminNav />
    </div>
  )
}
