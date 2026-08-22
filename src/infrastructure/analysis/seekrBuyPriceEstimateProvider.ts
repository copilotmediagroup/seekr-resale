import type {
  DealEstimateProvider,
  DealEstimationContext,
} from '../../domain/analysis/DealEstimator'
import type { MonetaryEstimate } from '../../domain/analysis/DealEstimate'
import { calculateSeekrBuyPrice } from '../../domain/analysis/calculateSeekrBuyPrice'

const getAmount = (
  context: DealEstimationContext,
  field:
    | 'estimatedResaleValue'
    | 'estimatedRepairCost'
    | 'estimatedTransportCost'
    | 'estimatedTaxesAndRegistration'
    | 'estimatedTransactionFees'
    | 'estimatedOtherCosts',
): number | null => {
  return context.resolvedEstimates?.[field]?.amount ?? null
}

export class SeekrBuyPriceEstimateProvider
  implements DealEstimateProvider
{
  readonly field = 'expectedPurchasePrice' as const

  async estimate(
    context: DealEstimationContext,
  ): Promise<MonetaryEstimate | null> {
    const estimatedResaleValue = getAmount(
      context,
      'estimatedResaleValue',
    )

    const estimatedRepairCost = getAmount(
      context,
      'estimatedRepairCost',
    )

    const estimatedTransportCost = getAmount(
      context,
      'estimatedTransportCost',
    )

    const estimatedTaxesAndRegistration = getAmount(
      context,
      'estimatedTaxesAndRegistration',
    )

    const estimatedTransactionFees = getAmount(
      context,
      'estimatedTransactionFees',
    )

    const estimatedOtherCosts = getAmount(
      context,
      'estimatedOtherCosts',
    )

    if (
      estimatedResaleValue === null ||
      estimatedRepairCost === null ||
      estimatedTransportCost === null ||
      estimatedOtherCosts === null
    ) {
      return null
    }

    const result = calculateSeekrBuyPrice({
      estimatedResaleValue,
      estimatedRepairCost,
      estimatedTransportCost,
      estimatedTaxesAndRegistration:
        estimatedTaxesAndRegistration ?? 0,
      estimatedTransactionFees:
        estimatedTransactionFees ?? 0,
      estimatedOtherCosts,
      minimumExpectedProfit:
        context.hunter.thresholds.minimumExpectedProfit,
      minimumRoiPercent:
        context.hunter.thresholds.minimumRoiPercent,
      maximumSpend:
        context.hunter.thresholds.maximumSpend,
    })

    if (result.maximumPurchasePrice === null) {
      return null
    }

    return {
      amount: result.maximumPurchasePrice,
      confidence: 'medium',
      origin: 'provider',
      basis:
        `SEEKR Buy Price calculated from estimated resale value, ` +
        `estimated acquisition costs, and the Hunter's configured ` +
        `profit, ROI, and maximum-spend requirements.`,
    }
  }
}
