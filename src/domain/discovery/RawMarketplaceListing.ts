import type { MarketplaceSource } from '../hunters/Hunter'

export interface RawMarketplaceListing {
  source: MarketplaceSource
  sourceListingId: string
  url: string
  title: string
  description: string | null
  askingPrice: number | null
  locationText: string | null
  postedAt: string | null
  discoveredAt: string
}
