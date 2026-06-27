import Link from "next/link"
import { PlusCircle } from "lucide-react"

import { getWorklist } from "@/lib/data/worklist"
import { PageContainer } from "@/components/primitives/page-container"
import { PageHeader } from "@/components/primitives/page-header"
import { Button } from "@/components/ui/button"
import { WorklistTable } from "@/components/worklist/worklist-table"

export const dynamic = "force-dynamic"

export default async function WorklistPage() {
  const rows = await getWorklist()

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Queue"
        title="Worklist"
        description="Every prior authorization in one filterable, sortable view."
      >
        <Button asChild>
          <Link href="/new">
            <PlusCircle className="h-4 w-4" />
            New request
          </Link>
        </Button>
      </PageHeader>
      <div className="mt-6">
        <WorklistTable rows={rows} />
      </div>
    </PageContainer>
  )
}
