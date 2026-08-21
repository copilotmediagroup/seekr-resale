import type { NormalizedListing } from '../discovery/NormalizedListing'
import type { Hunter } from '../hunters/Hunter'
import type {
  DealEstimateField,
  DealEstimateSet,
  MonetaryEstimate,
} from './DealEstimate'

export interface DealEstimationContext {
  listing: NormalizedListing
  hunter: Hunter
  resolvedEstimates?: Readonly<
    Partial<DealEstimateSet>
  >
}

export interface DealEstimateProvider {
  readonly field: DealEstimateField

  estimate(
    context: DealEstimationContext,
  ): Promise<MonetaryEstimate | null>
}
