import type {
  DealEstimateProvider,
  DealEstimationContext,
} from '../../domain/analysis/DealEstimator'
import type {
  MonetaryEstimate,
} from '../../domain/analysis/DealEstimate'
import type {
  TransactionFeeEstimateProvider,
} from '../../domain/fees/TransactionFeeEstimateProvider'

export class TransactionFeeDealEstimateProvider
  implements DealEstimateProvider
{
  readonly field =
    'estimatedTransactionFees' as const

  private readonly feeProvider:
    TransactionFeeEstimateProvider

  constructor(
    feeProvider: TransactionFeeEstimateProvider,
  ) {
    this.feeProvider = feeProvider
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
      await this.feeProvider
        .estimateTransactionFees({
          source: context.listing.source,
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
