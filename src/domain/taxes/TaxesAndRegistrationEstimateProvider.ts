import type {
  DealEstimateConfidence,
} from '../analysis/DealEstimate'

export interface TaxesAndRegistrationEstimateRequest {
  buyerPostalCode: string
  listingLocationText: string | null
  purchasePrice: number
}

export interface TaxesAndRegistrationEstimate {
  amount: number
  confidence: DealEstimateConfidence
  basis: string
}

export interface TaxesAndRegistrationEstimateProvider {
  estimateTaxesAndRegistration(
    request: TaxesAndRegistrationEstimateRequest,
  ): Promise<TaxesAndRegistrationEstimate | null>
}
