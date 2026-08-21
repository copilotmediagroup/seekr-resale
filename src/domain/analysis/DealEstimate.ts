export type DealEstimateConfidence =
  | 'low'
  | 'medium'
  | 'high'

export type DealEstimateOrigin =
  | 'automated'
  | 'user'
  | 'provider'

export interface MonetaryEstimate {
  amount: number
  confidence: DealEstimateConfidence
  origin: DealEstimateOrigin
  basis: string
}

export interface DealEstimateSet {
  estimatedResaleValue: MonetaryEstimate | null
  expectedPurchasePrice: MonetaryEstimate | null
  estimatedRepairCost: MonetaryEstimate | null
  estimatedTransportCost: MonetaryEstimate | null
  estimatedTaxesAndRegistration: MonetaryEstimate | null
  estimatedTransactionFees: MonetaryEstimate | null
  estimatedOtherCosts: MonetaryEstimate | null
}

export type DealEstimateField =
  keyof DealEstimateSet

export interface DealEstimateCompleteness {
  complete: boolean
  missing: DealEstimateField[]
}

export const inspectDealEstimateCompleteness = (
  estimates: DealEstimateSet,
): DealEstimateCompleteness => {
  const fields: DealEstimateField[] = [
    'estimatedResaleValue',
    'expectedPurchasePrice',
    'estimatedRepairCost',
    'estimatedTransportCost',
    'estimatedTaxesAndRegistration',
    'estimatedTransactionFees',
    'estimatedOtherCosts',
  ]

  const missing = fields.filter(
    (field) => estimates[field] === null,
  )

  return {
    complete: missing.length === 0,
    missing,
  }
}
