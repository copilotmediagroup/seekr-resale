import type { MarketplaceSource } from '../hunters/Hunter'

export interface NormalizedListing {
  id: string

  source: MarketplaceSource
  sourceListingId: string
  sourceUrl: string

  title: string
  description: string | null

  askingPrice: number | null
  locationText: string | null

  postedAt: string | null
  discoveredAt: string

  listingAgeDays: number | null
}
