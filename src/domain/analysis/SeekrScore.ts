export type SeekrScoreComponentKey =
  | 'profitPotential'
  | 'roiStrength'
  | 'acquisitionDiscount'
  | 'listingOpportunity'

export interface SeekrScoreComponent {
  key: SeekrScoreComponentKey
  score: number
  maximumScore: number
  explanation: string
}

export interface SeekrScore {
  total: number
  maximumScore: 100
  components: SeekrScoreComponent[]
}

export interface SeekrScoreInput {
  askingPrice: number
  expectedPurchasePrice: number
  estimatedResaleValue: number
  totalAcquisitionCost: number
  estimatedProfit: number
  roiPercent: number
  listingAgeDays: number | null
}
