import type { MarketplaceSource } from '../../domain/hunters/Hunter'
import type { DiscoveryRequest } from '../../domain/discovery/DiscoveryRequest'
import type { MarketplaceProvider } from '../../domain/discovery/MarketplaceProvider'
import type { RawMarketplaceListing } from '../../domain/discovery/RawMarketplaceListing'

export class DeterministicMarketplaceProvider
  implements MarketplaceProvider
{
  readonly source: MarketplaceSource

  private readonly listings: RawMarketplaceListing[]

  constructor(
    source: MarketplaceSource,
    listings: RawMarketplaceListing[],
  ) {
    this.source = source
    this.listings = listings.map((listing) => ({ ...listing }))
  }

  async discover(
    request: DiscoveryRequest,
  ): Promise<RawMarketplaceListing[]> {
    if (request.source !== this.source) {
      throw new Error(
        `Provider ${this.source} cannot discover source ${request.source}`,
      )
    }

    return this.listings.map((listing) => ({ ...listing }))
  }
}
