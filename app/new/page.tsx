import { getIntakeData } from "@/lib/data/intake"
import { PageContainer } from "@/components/primitives/page-container"
import { PageHeader } from "@/components/primitives/page-header"
import { IntakeForm } from "@/components/intake/intake-form"

export const dynamic = "force-dynamic"

export default async function NewRequestPage() {
  const data = await getIntakeData()

  return (
    <PageContainer className="max-w-4xl">
      <PageHeader
        eyebrow="Point of care"
        title="New request"
        description="Order a medication and find out instantly whether a prior authorization is required, while the patient is still in the visit."
      />
      <div className="mt-6">
        <IntakeForm data={data} />
      </div>
    </PageContainer>
  )
}
