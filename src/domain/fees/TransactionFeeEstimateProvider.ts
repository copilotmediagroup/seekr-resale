import type {
  DealEstimateConfidence,
} from '../analysis/DealEstimate'
import type {
  MarketplaceSource,
} from '../hunters/Hunter'

export interface TransactionFeeEstimateRequest {
  source: MarketplaceSource
  purchasePrice: number
}

export interface TransactionFeeEstimate {
  amount: number
  confidence: DealEstimateConfidence
  basis: string
}

export interface TransactionFeeEstimateProvider {
  estimateTransactionFees(
    request: TransactionFeeEstimateRequest,
  ): Promise<TransactionFeeEstimate | null>
}
