import type { Hunter } from '../hunters/Hunter'
import type { DealAnalysis } from './DealAnalysis'
import {
  analyzeListingDeal,
  type AnalyzeListingDealInput,
} from './analyzeListingDeal'
import {
  qualifyDealForHunter,
  type HunterQualificationResult,
} from './qualifyDealForHunter'
import {
  calculateDealDecision,
  type DealDecision,
} from './DealDecision'

export interface EvaluateListingForHunterInput
  extends AnalyzeListingDealInput {
  hunter: Hunter
}

export interface HunterDealEvaluation {
  hunterId: string
  listingId: string
  analysis: DealAnalysis
  qualification: HunterQualificationResult
  decision: DealDecision
}

export const evaluateListingForHunter = ({
  hunter,
  ...analysisInput
}: EvaluateListingForHunterInput): HunterDealEvaluation => {
  const analysis = analyzeListingDeal(analysisInput)

  const qualification = qualifyDealForHunter(
    hunter,
    analysis,
  )

  const decision = calculateDealDecision({
    askingPrice: analysisInput.listing.askingPrice,
    seekrBuyPrice: analysisInput.expectedPurchasePrice,
  })

  return {
    hunterId: hunter.id,
    listingId: analysis.listingId,
    analysis,
    qualification,
    decision,
  }
}
