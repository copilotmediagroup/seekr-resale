import type {
  DealEstimateProvider,
  DealEstimationContext,
} from '../../domain/analysis/DealEstimator'
import type { MonetaryEstimate } from '../../domain/analysis/DealEstimate'

export class ListingAskingPriceEstimateProvider
  implements DealEstimateProvider
{
  readonly field = 'expectedPurchasePrice' as const

  async estimate(
    context: DealEstimationContext,
  ): Promise<MonetaryEstimate | null> {
    const askingPrice = context.listing.askingPrice

    if (
      askingPrice === null ||
      !Number.isFinite(askingPrice) ||
      askingPrice < 0
    ) {
      return null
    }

    return {
      amount: askingPrice,
      confidence: 'high',
      origin: 'provider',
      basis:
        'Expected purchase price initialized from the marketplace listing asking price.',
    }
  }
}
