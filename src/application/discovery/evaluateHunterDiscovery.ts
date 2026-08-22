import type { Hunter } from '../../domain/hunters/Hunter'
import type { NormalizedListing } from '../../domain/discovery/NormalizedListing'
import type {
  EstimatedDealEvaluation,
  EstimatedDealEvaluationService,
} from '../analysis/evaluateEstimatedDeal'
import type { DealEstimateOverrides } from '../analysis/estimateDeal'
import type {
  DiscoverySourceFailure,
  DiscoverySourceSuccess,
} from './executeHunterDiscovery'
import { executeHunterDiscovery } from './executeHunterDiscovery'
import type { DiscoveryService } from './discoveryService'
import { normalizeMarketplaceListing } from './normalizeMarketplaceListing'

export interface HunterListingIntelligence {
  listing: NormalizedListing
  evaluation: EstimatedDealEvaluation
}

export interface HunterListingEvaluationFailure {
  listing: NormalizedListing
  error: string
}

export interface HunterDiscoveryIntelligenceResult {
  hunterId: string
  listings: NormalizedListing[]
  evaluations: HunterListingIntelligence[]
  evaluationFailures: HunterListingEvaluationFailure[]
  discoverySuccesses: DiscoverySourceSuccess[]
  discoveryFailures: DiscoverySourceFailure[]
  planningErrors: string[]
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}

export type ListingDealEstimateOverrides = Readonly<
  Record<string, DealEstimateOverrides | undefined>
>

export const evaluateHunterDiscovery = async (
  hunter: Hunter,
  discoveryService: DiscoveryService,
  evaluationService: EstimatedDealEvaluationService,
  overridesByListingId: ListingDealEstimateOverrides = {},
): Promise<HunterDiscoveryIntelligenceResult> => {
  const discovery = await executeHunterDiscovery(
    hunter,
    discoveryService,
  )

  if (discovery.planningErrors.length > 0) {
    return {
      hunterId: hunter.id,
      listings: [],
      evaluations: [],
      evaluationFailures: [],
      discoverySuccesses: discovery.successes,
      discoveryFailures: discovery.failures,
      planningErrors: [...discovery.planningErrors],
    }
  }

  const listings = discovery.listings.map(
    normalizeMarketplaceListing,
  )

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
    hunterId: hunter.id,
    listings,
    evaluations,
    evaluationFailures,
    discoverySuccesses: discovery.successes,
    discoveryFailures: discovery.failures,
    planningErrors: [],
  }
}
