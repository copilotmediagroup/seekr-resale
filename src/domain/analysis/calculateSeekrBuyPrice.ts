export interface CalculateSeekrBuyPriceInput {
  estimatedResaleValue: number
  estimatedRepairCost: number
  estimatedTransportCost: number
  estimatedTaxesAndRegistration: number
  estimatedTransactionFees: number
  estimatedOtherCosts: number
  minimumExpectedProfit: number | null
  minimumRoiPercent: number | null
  maximumSpend: number | null
}

export interface SeekrBuyPrice {
  maximumPurchasePrice: number | null
  maximumByProfit: number | null
  maximumByRoi: number | null
  maximumBySpend: number | null
  nonPurchaseAcquisitionCosts: number
}

const finiteNonNegative = (
  value: number,
  field: string,
): number => {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be a finite non-negative number.`)
  }

  return value
}

const normalizeMaximum = (value: number): number =>
  Math.max(0, value)

export const calculateSeekrBuyPrice = ({
  estimatedResaleValue,
  estimatedRepairCost,
  estimatedTransportCost,
  estimatedTaxesAndRegistration,
  estimatedTransactionFees,
  estimatedOtherCosts,
  minimumExpectedProfit,
  minimumRoiPercent,
  maximumSpend,
}: CalculateSeekrBuyPriceInput): SeekrBuyPrice => {
  finiteNonNegative(
    estimatedResaleValue,
    'estimatedResaleValue',
  )

  const nonPurchaseAcquisitionCosts =
    finiteNonNegative(
      estimatedRepairCost,
      'estimatedRepairCost',
    ) +
    finiteNonNegative(
      estimatedTransportCost,
      'estimatedTransportCost',
    ) +
    finiteNonNegative(
      estimatedTaxesAndRegistration,
      'estimatedTaxesAndRegistration',
    ) +
    finiteNonNegative(
      estimatedTransactionFees,
      'estimatedTransactionFees',
    ) +
    finiteNonNegative(
      estimatedOtherCosts,
      'estimatedOtherCosts',
    )

  const maximumByProfit =
    minimumExpectedProfit === null
      ? null
      : normalizeMaximum(
          estimatedResaleValue -
            nonPurchaseAcquisitionCosts -
            finiteNonNegative(
              minimumExpectedProfit,
              'minimumExpectedProfit',
            ),
        )

  const maximumByRoi =
    minimumRoiPercent === null
      ? null
      : normalizeMaximum(
          estimatedResaleValue /
            (1 +
              finiteNonNegative(
                minimumRoiPercent,
                'minimumRoiPercent',
              ) /
                100) -
            nonPurchaseAcquisitionCosts,
        )

  const maximumBySpend =
    maximumSpend === null
      ? null
      : finiteNonNegative(
          maximumSpend,
          'maximumSpend',
        )

  const constraints = [
    maximumByProfit,
    maximumByRoi,
    maximumBySpend,
  ].filter(
    (value): value is number => value !== null,
  )

  return {
    maximumPurchasePrice:
      constraints.length === 0
        ? null
        : Math.min(...constraints),
    maximumByProfit,
    maximumByRoi,
    maximumBySpend,
    nonPurchaseAcquisitionCosts,
  }
}
