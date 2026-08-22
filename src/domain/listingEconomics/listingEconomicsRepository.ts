import type { DealEstimateOverrides } from '../../application/analysis/estimateDeal'

export interface ListingEconomicsRepository {
  getByListingId(
    listingId: string,
  ): Promise<DealEstimateOverrides>

  save(
    listingId: string,
    overrides: DealEstimateOverrides,
  ): Promise<void>

  delete(listingId: string): Promise<void>
}
