import type { MarketplaceSource } from '../hunters/Hunter'
import type { DiscoveryRequest } from './DiscoveryRequest'
import type { RawMarketplaceListing } from './RawMarketplaceListing'

export interface MarketplaceProvider {
  readonly source: MarketplaceSource

  discover(
    request: DiscoveryRequest,
  ): Promise<RawMarketplaceListing[]>
}
