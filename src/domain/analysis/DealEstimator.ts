import type { NormalizedListing } from '../discovery/NormalizedListing'
import type { Hunter } from '../hunters/Hunter'
import type {
  DealEstimateField,
  MonetaryEstimate,
} from './DealEstimate'

export interface DealEstimationContext {
  listing: NormalizedListing
  hunter: Hunter
}

export interface DealEstimateProvider {
  readonly field: DealEstimateField

  estimate(
    context: DealEstimationContext,
  ): Promise<MonetaryEstimate | null>
}
