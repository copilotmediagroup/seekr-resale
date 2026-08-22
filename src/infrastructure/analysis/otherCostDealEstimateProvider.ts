import type {
  DealEstimateProvider,
  DealEstimationContext,
} from '../../domain/analysis/DealEstimator'
import type {
  MonetaryEstimate,
} from '../../domain/analysis/DealEstimate'
import type {
  OtherCostEstimateProvider,
} from '../../domain/costs/OtherCostEstimateProvider'

export class OtherCostDealEstimateProvider
  implements DealEstimateProvider
{
  readonly field = 'estimatedOtherCosts' as const

  private readonly otherCostProvider:
    OtherCostEstimateProvider

  constructor(
    otherCostProvider: OtherCostEstimateProvider,
  ) {
    this.otherCostProvider = otherCostProvider
  }

  async estimate(
    context: DealEstimationContext,
  ): Promise<MonetaryEstimate | null> {
    const estimate =
      await this.otherCostProvider.estimateOtherCosts({
        listingId: context.listing.id,
      })

    if (estimate === null) {
      return null
    }

    return {
      amount: estimate.amount,
      confidence: estimate.confidence,
      origin: 'provider',
      basis: estimate.basis,
    }
  }
}
