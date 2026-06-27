import { prisma } from "@/lib/prisma"
import { parseStringArray } from "@/lib/chart"

export type PayerRuleView = {
  medicationName: string
  brandName: string | null
  drugClass: string
  paRequired: boolean
  stepTherapyRequired: boolean
  requiredDiagnoses: string[]
  requiredPriorTherapies: string[]
  requiredLabs: string[]
  quantityLimit: boolean
  criteriaSummary: string
}

export type PayerView = {
  id: string
  name: string
  planType: string
  formularyRef: string
  requestCount: number
  paRequiredCount: number
  rules: PayerRuleView[]
}

export async function getPayers(): Promise<PayerView[]> {
  const payers = await prisma.payer.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { requests: true } },
      rules: {
        include: { medication: true },
        orderBy: { medication: { name: "asc" } },
      },
    },
  })

  return payers.map((p) => {
    const rules: PayerRuleView[] = p.rules.map((r) => ({
      medicationName: r.medication.name,
      brandName: r.medication.brandName,
      drugClass: r.medication.drugClass,
      paRequired: r.paRequired,
      stepTherapyRequired: r.stepTherapyRequired,
      requiredDiagnoses: parseStringArray(r.requiredDiagnoses),
      requiredPriorTherapies: parseStringArray(r.requiredPriorTherapies),
      requiredLabs: parseStringArray(r.requiredLabs),
      quantityLimit: r.quantityLimit,
      criteriaSummary: r.criteriaSummary,
    }))
    return {
      id: p.id,
      name: p.name,
      planType: p.planType,
      formularyRef: p.formularyRef,
      requestCount: p._count.requests,
      paRequiredCount: rules.filter((r) => r.paRequired).length,
      rules: rules.sort(
        (a, b) => Number(b.paRequired) - Number(a.paRequired),
      ),
    }
  })
}
