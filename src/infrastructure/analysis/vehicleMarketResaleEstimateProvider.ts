import type {
  DealEstimateProvider,
  DealEstimationContext,
} from '../../domain/analysis/DealEstimator'
import type { MonetaryEstimate } from '../../domain/analysis/DealEstimate'
import type { VehicleMarketComparableProvider } from '../../domain/valuation/VehicleMarketComparableProvider'
import { estimateVehicleMarketValue } from '../../domain/valuation/estimateVehicleMarketValue'

export class VehicleMarketResaleEstimateProvider
  implements DealEstimateProvider
{
  readonly field = 'estimatedResaleValue' as const

  private readonly comparableProvider:
    VehicleMarketComparableProvider

  constructor(
    comparableProvider: VehicleMarketComparableProvider,
  ) {
    this.comparableProvider = comparableProvider
  }

  async estimate(
    context: DealEstimationContext,
  ): Promise<MonetaryEstimate | null> {
    const vehicle = context.listing.vehicle

    if (vehicle === null) {
      return null
    }

    const comparables =
      await this.comparableProvider.findComparables({
        hunterId: context.hunter.id,
        targetListingId: context.listing.id,
        vehicle,
        locationText: context.listing.locationText,
      })

    return estimateVehicleMarketValue({
      vehicle,
      comparables,
    })
  }
}
