import { Sidebar } from "@/components/shell/sidebar"
import { Topbar } from "@/components/shell/topbar"
import { FooterDisclaimer } from "@/components/shell/footer-disclaimer"
import {
  CommandMenuProvider,
  type CommandSearchItem,
} from "@/components/shell/command-menu"
import type { NotificationItem } from "@/components/shell/notifications"

export function AppShell({
  children,
  notifications,
  searchItems,
}: {
  children: React.ReactNode
  notifications: NotificationItem[]
  searchItems: CommandSearchItem[]
}) {
  return (
    <CommandMenuProvider searchItems={searchItems}>
      <div className="flex min-h-svh">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar notifications={notifications} />
          <main className="flex-1">{children}</main>
          <FooterDisclaimer />
        </div>
      </div>
    </CommandMenuProvider>
  )
}
