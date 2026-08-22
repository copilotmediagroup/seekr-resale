export interface OtherCostEstimateRequest {
  listingId: string
}

export interface OtherCostEstimate {
  amount: number
  confidence: 'low' | 'medium' | 'high'
  basis: string
}

export interface OtherCostEstimateProvider {
  estimateOtherCosts(
    request: OtherCostEstimateRequest,
  ): Promise<OtherCostEstimate | null>
}
