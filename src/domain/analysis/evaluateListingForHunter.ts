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

export interface EvaluateListingForHunterInput
  extends AnalyzeListingDealInput {
  hunter: Hunter
}

export interface HunterDealEvaluation {
  hunterId: string
  listingId: string
  analysis: DealAnalysis
  qualification: HunterQualificationResult
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

  return {
    hunterId: hunter.id,
    listingId: analysis.listingId,
    analysis,
    qualification,
  }
}
