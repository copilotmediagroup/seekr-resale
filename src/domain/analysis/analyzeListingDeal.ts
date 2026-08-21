import type { NormalizedListing } from '../discovery/NormalizedListing'
import type {
  DealAnalysis,
  DealValuation,
} from './DealAnalysis'
import {
  calculateAcquisitionCosts,
  calculateDealEconomics,
  type CalculateAcquisitionCostsInput,
} from './calculateDealEconomics'
import { calculateSeekrScore } from './calculateSeekrScore'

export interface AnalyzeListingDealInput {
  listing: NormalizedListing
  valuation: DealValuation

  expectedPurchasePrice: number
  estimatedRepairCost: number
  estimatedTransportCost: number
  estimatedTaxesAndRegistration: number
  estimatedTransactionFees: number
  estimatedOtherCosts: number
}

export const analyzeListingDeal = ({
  listing,
  valuation,
  expectedPurchasePrice,
  estimatedRepairCost,
  estimatedTransportCost,
  estimatedTaxesAndRegistration,
  estimatedTransactionFees,
  estimatedOtherCosts,
}: AnalyzeListingDealInput): DealAnalysis => {
  if (listing.askingPrice === null) {
    throw new Error(
      'Cannot analyze deal economics without an asking price.',
    )
  }

  const acquisitionInput: CalculateAcquisitionCostsInput = {
    askingPrice: listing.askingPrice,
    expectedPurchasePrice,
    estimatedRepairCost,
    estimatedTransportCost,
    estimatedTaxesAndRegistration,
    estimatedTransactionFees,
    estimatedOtherCosts,
  }

  const acquisitionCosts =
    calculateAcquisitionCosts(acquisitionInput)

  const economics = calculateDealEconomics({
    acquisitionCosts,
    estimatedResaleValue: valuation.estimatedResaleValue,
  })

  const seekrScore = calculateSeekrScore({
    askingPrice: economics.askingPrice,
    expectedPurchasePrice: economics.expectedPurchasePrice,
    estimatedResaleValue: economics.estimatedResaleValue,
    totalAcquisitionCost: economics.totalAcquisitionCost,
    estimatedProfit: economics.estimatedProfit,
    roiPercent: economics.roiPercent,
    listingAgeDays: listing.listingAgeDays,
  })

  return {
    listingId: listing.id,
    status: 'analyzed',
    valuation,
    acquisitionCosts,
    economics,
    seekrScore: seekrScore.total,
  }
}
