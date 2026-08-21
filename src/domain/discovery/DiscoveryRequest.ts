import type {
  HunterCategory,
  MarketplaceSource,
} from '../hunters/Hunter'

export interface DiscoveryLocation {
  postalCode: string
  radiusMiles: number | null
}

export interface DiscoveryRequest {
  hunterId: string
  source: MarketplaceSource
  location: DiscoveryLocation
  categories: HunterCategory[]
}
