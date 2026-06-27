import {
  Network,
  DatabaseZap,
  FileCheck2,
  ShieldCheck,
} from "lucide-react"

import { PageContainer } from "@/components/primitives/page-container"
import { PageHeader } from "@/components/primitives/page-header"
import { SectionCard } from "@/components/primitives/section-card"
import { DescList, Desc } from "@/components/primitives/desc"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const dynamic = "force-dynamic"

const TEAM = [
  { name: "Dr. Alex Rivera", role: "PA Coordinator", tag: "You" },
  { name: "Jordan Kim", role: "PA Coordinator", tag: null },
  { name: "Sam Patel", role: "PA Coordinator", tag: null },
  { name: "Dr. Taylor Brooks", role: "Prescriber", tag: null },
]

const INTEGRATIONS = [
  {
    icon: Network,
    title: "FHIR / Da Vinci",
    body: "Connect CRD, DTR, and PAS endpoints to exchange coverage requirements and submit electronically.",
  },
  {
    icon: DatabaseZap,
    title: "EHR (HL7 FHIR)",
    body: "Read patient charts, diagnoses, prior therapies, and labs directly from the EHR.",
  },
  {
    icon: FileCheck2,
    title: "Clearinghouse",
    body: "Route submissions and decisions through a payer clearinghouse with status tracking.",
  },
]

export default function SettingsPage() {
  return (
    <PageContainer className="max-w-5xl">
      <PageHeader
        eyebrow="Configuration"
        title="Settings"
        description="Practice profile, team roles, and integrations."
      />

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard
          title="Practice profile"
          description="Demonstration values. No real practice data is stored."
        >
          <DescList>
            <Desc label="Practice name">Northside Internal Medicine</Desc>
            <Desc label="Group NPI" mono>
              1942807361
            </Desc>
            <Desc label="Specialty">Internal Medicine, multi-specialty</Desc>
            <Desc label="Location">Portland, OR</Desc>
            <Desc label="Time zone">America/Los_Angeles</Desc>
          </DescList>
        </SectionCard>

        <SectionCard
          title="Team and roles"
          description="Who works prior authorizations at this practice."
          contentClassName="px-0"
        >
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Member</TableHead>
                <TableHead className="text-right">Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {TEAM.map((m) => (
                <TableRow key={m.name} className="hover:bg-transparent">
                  <TableCell>
                    <span className="font-medium">{m.name}</span>
                    {m.tag && (
                      <Badge variant="secondary" className="ml-2 align-middle">
                        {m.tag}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {m.role}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SectionCard>
      </div>

      <div className="mt-4">
        <SectionCard
          title="Integrations"
          description="The production path. Live data sources connect here."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {INTEGRATIONS.map((it) => {
              const Icon = it.icon
              return (
                <div
                  key={it.title}
                  className="flex flex-col rounded-lg border border-border bg-muted/30 p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-background text-primary ring-1 ring-border">
                      <Icon className="h-4 w-4" />
                    </span>
                    <Badge variant="secondary">Coming soon</Badge>
                  </div>
                  <h3 className="mt-3 text-sm font-semibold">{it.title}</h3>
                  <p className="mt-1 flex-1 text-pretty text-xs leading-relaxed text-muted-foreground">
                    {it.body}
                  </p>
                  <Button variant="outline" size="sm" disabled className="mt-3">
                    Connect
                  </Button>
                </div>
              )
            })}
          </div>
        </SectionCard>
      </div>

      <div className="mt-4">
        <SectionCard title="Compliance">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
              AuthFlow is a demonstration prototype. It is not a clinical or
              regulated medical device, is not HIPAA covered, and uses only
              synthetic data. AI-generated letters are always drafts for clinician
              review and are never submitted automatically.
            </p>
          </div>
        </SectionCard>
      </div>
    </PageContainer>
  )
}
