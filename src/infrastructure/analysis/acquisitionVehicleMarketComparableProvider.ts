import type {
  MarketplaceAcquisitionAdapter,
  MarketplaceAcquisitionContext,
} from '../../domain/discovery/MarketplaceAcquisition'
import type { MarketplaceAcquisitionRequest } from '../../domain/discovery/MarketplaceAcquisitionRequest'
import type { MarketplaceSource } from '../../domain/hunters/Hunter'
import type {
  VehicleMarketComparableProvider,
  VehicleMarketComparableQuery,
} from '../../domain/valuation/VehicleMarketComparableProvider'
import type { VehicleMarketComparable } from '../../domain/valuation/VehicleMarketComparable'
import { mapMarketplaceListingToVehicleComparable } from './mapMarketplaceListingToVehicleComparable'

export interface AcquisitionVehicleMarketComparableProviderOptions {
  source: MarketplaceSource
  acquisitionContext: MarketplaceAcquisitionContext
  postalCode?: string | null
  radiusMiles?: number | null
}

export class AcquisitionVehicleMarketComparableProvider
  implements VehicleMarketComparableProvider
{
  private readonly adapter: MarketplaceAcquisitionAdapter
  private readonly source: MarketplaceSource
  private readonly acquisitionContext: MarketplaceAcquisitionContext
  private readonly postalCode: string | null
  private readonly radiusMiles: number | null

  constructor(
    adapter: MarketplaceAcquisitionAdapter,
    options: AcquisitionVehicleMarketComparableProviderOptions,
  ) {
    if (adapter.source !== options.source) {
      throw new Error(
        `Marketplace acquisition adapter source mismatch: expected ${options.source}, received ${adapter.source}.`,
      )
    }

    this.adapter = adapter
    this.source = options.source
    this.acquisitionContext = { ...options.acquisitionContext }
    this.postalCode = options.postalCode ?? null
    this.radiusMiles = options.radiusMiles ?? null
  }

  async findComparables(
    query: VehicleMarketComparableQuery,
  ): Promise<VehicleMarketComparable[]> {
    const request: MarketplaceAcquisitionRequest = {
      source: this.source,
      location: {
        postalCode: this.postalCode,
        radiusMiles: this.radiusMiles,
        locationText: query.locationText,
      },
      categories: ['cars'],
      vehicle: { ...query.vehicle },
      correlationId: null,
    }

    const listings = await this.adapter.acquire(
      request,
      this.acquisitionContext,
    )

    return listings.flatMap((listing) => {
      const comparable =
        mapMarketplaceListingToVehicleComparable(listing)

      return comparable === null ? [] : [comparable]
    })
  }
}
