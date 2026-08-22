import type {
  MarketplaceSource,
} from '../../domain/hunters/Hunter'
import type { VehicleListingMetadata } from '../../domain/discovery/VehicleListingMetadata'

export interface HunterSubmittedMarketplaceListing {
  sourceListingId: string
  url: string
  title: string
  description?: string | null
  askingPrice?: number | null
  vehicle?: VehicleListingMetadata | null
  locationText?: string | null
  postedAt?: string | null
}

export interface HunterMarketplaceSubmission {
  source: MarketplaceSource
  listings: HunterSubmittedMarketplaceListing[]
}

export interface HunterAcquisitionPort {
  submitMarketplaceListings(
    hunterId: string,
    submission: HunterMarketplaceSubmission,
  ): void

  clearMarketplaceListings(
    hunterId: string,
    source: MarketplaceSource,
  ): void

  clearHunterMarketplaceListings(
    hunterId: string,
  ): void
}
