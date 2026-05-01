import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { AppTopbar } from '@/components/layout/app-topbar'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { breadcrumbsForPath } from '@/lib/breadcrumbs'

export function AppShell() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const breadcrumbItems = breadcrumbsForPath(pathname)

  return (
    <div className="flex min-h-svh bg-[var(--background)] text-[var(--foreground)]">
      <aside className="relative hidden w-[260px] shrink-0 border-r border-[var(--border)] bg-[var(--card)] md:flex md:flex-col">
        <AppSidebar role={user.role} />
      </aside>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 md:hidden">
          <AppSidebar role={user.role} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex min-h-svh min-w-0 flex-1 flex-col">
        <AppTopbar
          breadcrumbItems={breadcrumbItems}
          onMenu={() => setMobileOpen(true)}
        />
        <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
