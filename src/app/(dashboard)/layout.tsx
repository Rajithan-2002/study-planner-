import { Sidebar } from '@/components/layout/sidebar'
import { QuickAddButton } from '@/components/layout/quick-add-button'
import { BottomNav } from '@/components/layout/bottom-nav'
import { CommandPalette } from '@/components/layout/command-palette'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-transparent">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pt-6 px-4 pb-24 md:pb-12 lg:pt-8 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {children}
        </div>
      </main>
      <QuickAddButton />
      <BottomNav />
      <CommandPalette />
    </div>
  )
}
