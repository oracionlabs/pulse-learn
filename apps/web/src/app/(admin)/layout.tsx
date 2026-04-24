import { AdminSidebar } from '@/components/layout/sidebar'
import { MobileAdminNav } from '@/components/layout/mobile-admin-nav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full">
      <AdminSidebar />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0 h-full">
        <div className="flex-1 overflow-auto">
          {children}
        </div>
        <MobileAdminNav />
      </div>
    </div>
  )
}
