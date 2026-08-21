import type {
  DealEstimateProvider,
  DealEstimationContext,
} from '../../domain/analysis/DealEstimator'
import type {
  MonetaryEstimate,
} from '../../domain/analysis/DealEstimate'
import type {
  TransportEstimateProvider,
} from '../../domain/transport/TransportEstimateProvider'

export class TransportDealEstimateProvider
  implements DealEstimateProvider
{
  readonly field = 'estimatedTransportCost' as const

  private readonly transportProvider:
    TransportEstimateProvider

  constructor(
    transportProvider: TransportEstimateProvider,
  ) {
    this.transportProvider = transportProvider
  }

  async estimate(
    context: DealEstimationContext,
  ): Promise<MonetaryEstimate | null> {
    const destination =
      context.listing.locationText?.trim() ?? ''

    if (destination.length === 0) {
      return null
    }

    const transportEstimate =
      await this.transportProvider.estimateTransport({
        originPostalCode:
          context.hunter.location.postalCode,
        destinationLocationText: destination,
      })

    if (transportEstimate === null) {
      return null
    }

    return {
      amount: transportEstimate.amount,
      confidence: transportEstimate.confidence,
      origin: 'provider',
      basis: transportEstimate.basis,
    }
  }
}
