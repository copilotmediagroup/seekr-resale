import type { MarketplaceSource } from '../../domain/hunters/Hunter'
import type { DiscoveryRequest } from '../../domain/discovery/DiscoveryRequest'
import type { MarketplaceProvider } from '../../domain/discovery/MarketplaceProvider'
import type { RawMarketplaceListing } from '../../domain/discovery/RawMarketplaceListing'

export class DiscoveryService {
  private readonly providers: Map<
    MarketplaceSource,
    MarketplaceProvider
  >

  constructor(providers: MarketplaceProvider[]) {
    this.providers = new Map(
      providers.map((provider) => [provider.source, provider]),
    )
  }

  async discover(
    request: DiscoveryRequest,
  ): Promise<RawMarketplaceListing[]> {
    const provider = this.providers.get(request.source)

    if (!provider) {
      throw new Error(
        `No discovery provider registered for source: ${request.source}`,
      )
    }

    return provider.discover(request)
  }
}
