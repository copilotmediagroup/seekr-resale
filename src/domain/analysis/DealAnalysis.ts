export type DealAnalysisStatus =
  | 'pending_valuation'
  | 'analyzed'

export interface DealValuation {
  estimatedResaleValue: number
}

export interface AcquisitionCostEstimate {
  askingPrice: number
  expectedPurchasePrice: number
  estimatedRepairCost: number
  estimatedTransportCost: number
  estimatedTaxesAndRegistration: number
  estimatedTransactionFees: number
  estimatedOtherCosts: number
  totalAcquisitionCost: number
}

export interface DealEconomics {
  askingPrice: number
  expectedPurchasePrice: number
  estimatedResaleValue: number
  totalAcquisitionCost: number
  estimatedProfit: number
  roiPercent: number
}

export interface DealAnalysis {
  listingId: string
  status: DealAnalysisStatus
  valuation: DealValuation | null
  acquisitionCosts: AcquisitionCostEstimate | null
  economics: DealEconomics | null
  seekrScore: number | null
}
