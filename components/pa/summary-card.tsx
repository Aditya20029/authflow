import { DescList, Desc } from "@/components/primitives/desc"
import { formatDate, formatHours } from "@/lib/format"
import type { PaDetail } from "@/lib/data/pa"

function Group({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
        {title}
      </p>
      {children}
    </div>
  )
}

export function SummaryCard({ pa }: { pa: PaDetail }) {
  return (
    <div className="space-y-5">
      <Group title="Patient">
        <DescList>
          <Desc label="Name">{pa.patient.name}</Desc>
          <Desc label="Age and sex">
            {pa.patient.age}, {pa.patient.sex}
          </Desc>
          <Desc label="MRN" mono>
            {pa.patient.mrn}
          </Desc>
          <Desc label="Member ID" mono>
            {pa.patient.memberId}
          </Desc>
        </DescList>
      </Group>

      <Group title="Plan">
        <DescList>
          <Desc label="Payer">{pa.payer.name}</Desc>
          <Desc label="Plan type">{pa.payer.planType}</Desc>
          <Desc label="Formulary" mono>
            {pa.payer.formularyRef}
          </Desc>
        </DescList>
      </Group>

      <Group title="Care team">
        <DescList>
          <Desc label="Prescriber">{pa.provider.name}</Desc>
          <Desc label="Specialty">{pa.provider.specialty}</Desc>
          <Desc label="NPI" mono>
            {pa.provider.npi}
          </Desc>
          <Desc label="Coordinator">{pa.coordinator ?? "Unassigned"}</Desc>
        </DescList>
      </Group>

      <Group title="Key dates">
        <DescList>
          <Desc label="Created">{formatDate(pa.createdAt)}</Desc>
          {pa.submittedAt && (
            <Desc label="Submitted">{formatDate(pa.submittedAt)}</Desc>
          )}
          {pa.decisionAt && (
            <Desc label="Decided">{formatDate(pa.decisionAt)}</Desc>
          )}
          <Desc label="Deadline">{formatDate(pa.deadline)}</Desc>
          {pa.turnaroundHours != null && (
            <Desc label="Turnaround">{formatHours(pa.turnaroundHours)}</Desc>
          )}
        </DescList>
      </Group>
    </div>
  )
}
