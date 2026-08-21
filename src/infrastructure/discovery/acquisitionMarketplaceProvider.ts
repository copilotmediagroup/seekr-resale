import type { DiscoveryRequest } from '../../domain/discovery/DiscoveryRequest'
import type {
  MarketplaceAcquisitionAdapter,
  MarketplaceAcquisitionContext,
} from '../../domain/discovery/MarketplaceAcquisition'
import type { MarketplaceProvider } from '../../domain/discovery/MarketplaceProvider'
import type { RawMarketplaceListing } from '../../domain/discovery/RawMarketplaceListing'
import { mapDiscoveryRequestToMarketplaceAcquisitionRequest } from './mapDiscoveryRequestToMarketplaceAcquisitionRequest'

export type MarketplaceAcquisitionContextResolver = (
  request: DiscoveryRequest,
) =>
  | MarketplaceAcquisitionContext
  | Promise<MarketplaceAcquisitionContext>

export class AcquisitionMarketplaceProvider
  implements MarketplaceProvider
{
  readonly source

  private readonly adapter: MarketplaceAcquisitionAdapter
  private readonly resolveContext: MarketplaceAcquisitionContextResolver

  constructor(
    adapter: MarketplaceAcquisitionAdapter,
    resolveContext: MarketplaceAcquisitionContextResolver,
  ) {
    this.adapter = adapter
    this.source = adapter.source
    this.resolveContext = resolveContext
  }

  async discover(
    request: DiscoveryRequest,
  ): Promise<RawMarketplaceListing[]> {
    if (request.source !== this.source) {
      throw new Error(
        `Provider ${this.source} cannot discover source ${request.source}`,
      )
    }

    const context = await this.resolveContext(request)

    const acquisitionRequest =
      mapDiscoveryRequestToMarketplaceAcquisitionRequest(request)

    const listings = await this.adapter.acquire(
      acquisitionRequest,
      context,
    )

    return listings.map((listing) => ({ ...listing }))
  }
}
