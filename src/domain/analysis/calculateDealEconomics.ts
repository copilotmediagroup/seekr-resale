import type {
  AcquisitionCostEstimate,
  DealEconomics,
} from './DealAnalysis'

export interface CalculateAcquisitionCostsInput {
  askingPrice: number
  expectedPurchasePrice: number
  estimatedRepairCost: number
  estimatedTransportCost: number
  estimatedTaxesAndRegistration: number
  estimatedTransactionFees: number
  estimatedOtherCosts: number
}

export const calculateAcquisitionCosts = (
  input: CalculateAcquisitionCostsInput,
): AcquisitionCostEstimate => {
  const totalAcquisitionCost =
    input.expectedPurchasePrice +
    input.estimatedRepairCost +
    input.estimatedTransportCost +
    input.estimatedTaxesAndRegistration +
    input.estimatedTransactionFees +
    input.estimatedOtherCosts

  return {
    ...input,
    totalAcquisitionCost,
  }
}

export interface CalculateDealEconomicsInput {
  acquisitionCosts: AcquisitionCostEstimate
  estimatedResaleValue: number
}

export const calculateDealEconomics = ({
  acquisitionCosts,
  estimatedResaleValue,
}: CalculateDealEconomicsInput): DealEconomics => {
  const estimatedProfit =
    estimatedResaleValue - acquisitionCosts.totalAcquisitionCost

  const roiPercent =
    acquisitionCosts.totalAcquisitionCost > 0
      ? (estimatedProfit / acquisitionCosts.totalAcquisitionCost) * 100
      : 0

  return {
    askingPrice: acquisitionCosts.askingPrice,
    expectedPurchasePrice: acquisitionCosts.expectedPurchasePrice,
    estimatedResaleValue,
    totalAcquisitionCost: acquisitionCosts.totalAcquisitionCost,
    estimatedProfit,
    roiPercent,
  }
}
