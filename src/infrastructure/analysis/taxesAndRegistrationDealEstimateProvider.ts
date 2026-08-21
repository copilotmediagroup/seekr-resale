import type {
  DealEstimateProvider,
  DealEstimationContext,
} from '../../domain/analysis/DealEstimator'
import type {
  MonetaryEstimate,
} from '../../domain/analysis/DealEstimate'
import type {
  TaxesAndRegistrationEstimateProvider,
} from '../../domain/taxes/TaxesAndRegistrationEstimateProvider'

export class TaxesAndRegistrationDealEstimateProvider
  implements DealEstimateProvider
{
  readonly field =
    'estimatedTaxesAndRegistration' as const

  private readonly taxesProvider:
    TaxesAndRegistrationEstimateProvider

  constructor(
    taxesProvider:
      TaxesAndRegistrationEstimateProvider,
  ) {
    this.taxesProvider = taxesProvider
  }

  async estimate(
    context: DealEstimationContext,
  ): Promise<MonetaryEstimate | null> {
    const purchasePrice =
      context.resolvedEstimates
        ?.expectedPurchasePrice
        ?.amount

    if (
      purchasePrice === undefined ||
      !Number.isFinite(purchasePrice) ||
      purchasePrice < 0
    ) {
      return null
    }

    const estimate =
      await this.taxesProvider
        .estimateTaxesAndRegistration({
          buyerPostalCode:
            context.hunter.location.postalCode,
          listingLocationText:
            context.listing.locationText,
          purchasePrice,
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
