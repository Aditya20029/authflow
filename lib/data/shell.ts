import { prisma } from "@/lib/prisma"
import { isDecided } from "@/lib/status"
import { getDeadlineInfo } from "@/lib/deadline"
import { formatRelative } from "@/lib/format"
import type { NotificationItem } from "@/components/shell/notifications"
import type { CommandSearchItem } from "@/components/shell/command-menu"

export type ShellData = {
  notifications: NotificationItem[]
  searchItems: CommandSearchItem[]
}

/**
 * Global shell data: the command-palette search index and the notifications
 * panel, both derived from current requests rather than stored separately.
 */
export async function getShellData(): Promise<ShellData> {
  const requests = await prisma.priorAuthRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          mrn: true,
          memberId: true,
        },
      },
      medication: { select: { name: true, brandName: true } },
      payer: { select: { name: true } },
    },
  })

  const searchItems: CommandSearchItem[] = []
  const seenPatients = new Set<string>()

  for (const r of requests) {
    const name = `${r.patient.firstName} ${r.patient.lastName}`
    searchItems.push({
      id: r.id,
      type: "request",
      title: `${r.referenceId}  ${name}`,
      subtitle: r.medication.name,
      href: `/pa/${r.id}`,
      keywords: [
        r.referenceId,
        name,
        r.medication.name,
        r.medication.brandName ?? "",
        r.payer.name,
      ],
    })
  }

  for (const r of requests) {
    if (seenPatients.has(r.patient.id)) continue
    seenPatients.add(r.patient.id)
    const name = `${r.patient.firstName} ${r.patient.lastName}`
    searchItems.push({
      id: r.patient.id,
      type: "patient",
      title: name,
      subtitle: `MRN ${r.patient.mrn}`,
      href: `/pa/${r.id}`,
      keywords: [r.patient.mrn, r.patient.memberId, name],
    })
  }

  const notifications: NotificationItem[] = []

  const risky = requests
    .filter((r) => !isDecided(r.status))
    .map((r) => ({ r, info: getDeadlineInfo(r.deadline, false) }))
    .filter((x) => x.info.state === "overdue" || x.info.state === "atRisk")
    .sort((a, b) => (a.info.hoursLeft ?? 0) - (b.info.hoursLeft ?? 0))
    .slice(0, 6)

  for (const { r, info } of risky) {
    const name = `${r.patient.firstName} ${r.patient.lastName}`
    notifications.push({
      id: `risk-${r.id}`,
      tone: info.state === "overdue" ? "danger" : "warning",
      title: `${info.state === "overdue" ? "Overdue" : "Deadline near"}: ${name}`,
      description: `${r.referenceId} · ${r.medication.name}`,
      href: `/pa/${r.id}`,
      timestamp: info.label,
    })
  }

  const recentDecided = requests
    .filter((r) => isDecided(r.status) && r.decisionAt)
    .sort((a, b) => b.decisionAt!.getTime() - a.decisionAt!.getTime())
    .slice(0, 3)

  for (const r of recentDecided) {
    const name = `${r.patient.firstName} ${r.patient.lastName}`
    notifications.push({
      id: `decision-${r.id}`,
      tone: r.status === "Approved" ? "success" : "danger",
      title: `${r.status}: ${name}`,
      description: `${r.referenceId} · ${r.medication.name}`,
      href: `/pa/${r.id}`,
      timestamp: formatRelative(r.decisionAt!),
    })
  }

  return { notifications: notifications.slice(0, 8), searchItems }
}
