export type DealAnalysisStatus =
  | 'pending_valuation'
  | 'analyzed'

export interface DealValuation {
  estimatedResaleValue: number
}

export interface DealEconomics {
  askingPrice: number
  estimatedResaleValue: number
  estimatedProfit: number
  roiPercent: number
}

export interface DealAnalysis {
  listingId: string

  status: DealAnalysisStatus

  valuation: DealValuation | null
  economics: DealEconomics | null

  seekrScore: number | null
}
