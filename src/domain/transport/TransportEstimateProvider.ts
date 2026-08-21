import type {
  DealEstimateConfidence,
} from '../analysis/DealEstimate'

export interface TransportEstimateRequest {
  originPostalCode: string
  destinationLocationText: string
}

export interface TransportEstimate {
  amount: number
  confidence: DealEstimateConfidence
  basis: string
}

export interface TransportEstimateProvider {
  estimateTransport(
    request: TransportEstimateRequest,
  ): Promise<TransportEstimate | null>
}
