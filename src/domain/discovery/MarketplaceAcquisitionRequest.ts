import type {
  HunterCategory,
  MarketplaceSource,
} from '../hunters/Hunter'
import type { VehicleListingMetadata } from './VehicleListingMetadata'

export interface MarketplaceAcquisitionLocation {
  postalCode: string | null
  radiusMiles: number | null
  locationText: string | null
}

export interface MarketplaceAcquisitionRequest {
  source: MarketplaceSource
  location: MarketplaceAcquisitionLocation
  categories: HunterCategory[]
  vehicle: VehicleListingMetadata | null
  correlationId: string | null
}
