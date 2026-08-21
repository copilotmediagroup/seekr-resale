import type { MarketplaceSource } from '../hunters/Hunter'
import type { VehicleListingMetadata } from './VehicleListingMetadata'

export interface NormalizedListing {
  id: string

  source: MarketplaceSource
  sourceListingId: string
  sourceUrl: string

  title: string
  description: string | null

  askingPrice: number | null
  vehicle: VehicleListingMetadata | null
  locationText: string | null

  postedAt: string | null
  discoveredAt: string

  listingAgeDays: number | null
}
