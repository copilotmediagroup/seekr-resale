import type { Hunter } from '../../domain/hunters/Hunter'
import type { NormalizedListing } from '../../domain/discovery/NormalizedListing'
import type {
  EstimatedDealEvaluation,
  EstimatedDealEvaluationService,
} from '../analysis/evaluateEstimatedDeal'
import type { DealEstimateOverrides } from '../analysis/estimateDeal'

export interface HunterListingIntelligence {
  listing: NormalizedListing
  evaluation: EstimatedDealEvaluation
}

export interface HunterListingEvaluationFailure {
  listing: NormalizedListing
  error: string
}

export type ListingDealEstimateOverrides = Readonly<
  Record<string, DealEstimateOverrides | undefined>
>

export interface NormalizedHunterListingEvaluationResult {
  evaluations: HunterListingIntelligence[]
  evaluationFailures: HunterListingEvaluationFailure[]
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}

export const evaluateNormalizedHunterListings = async (
  hunter: Hunter,
  listings: NormalizedListing[],
  evaluationService: EstimatedDealEvaluationService,
  overridesByListingId: ListingDealEstimateOverrides = {},
): Promise<NormalizedHunterListingEvaluationResult> => {
  const outcomes = await Promise.all(
    listings.map(async (listing) => {
      try {
        const evaluation = await evaluationService.evaluate({
          hunter,
          listing,
          overrides: overridesByListingId[listing.id],
        })

        return {
          status: 'success' as const,
          listing,
          evaluation,
        }
      } catch (error) {
        return {
          status: 'failure' as const,
          listing,
          error: getErrorMessage(error),
        }
      }
    }),
  )

  const evaluations: HunterListingIntelligence[] = []
  const evaluationFailures: HunterListingEvaluationFailure[] = []

  for (const outcome of outcomes) {
    if (outcome.status === 'success') {
      evaluations.push({
        listing: outcome.listing,
        evaluation: outcome.evaluation,
      })

      continue
    }

    evaluationFailures.push({
      listing: outcome.listing,
      error: outcome.error,
    })
  }

  return {
    evaluations,
    evaluationFailures,
  }
}
