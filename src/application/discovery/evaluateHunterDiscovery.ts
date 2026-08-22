import type { Hunter } from '../../domain/hunters/Hunter'
import type { NormalizedListing } from '../../domain/discovery/NormalizedListing'
import type {
  EstimatedDealEvaluationService,
} from '../analysis/evaluateEstimatedDeal'
import type {
  DiscoverySourceFailure,
  DiscoverySourceSuccess,
} from './executeHunterDiscovery'
import { executeHunterDiscovery } from './executeHunterDiscovery'
import type { DiscoveryService } from './discoveryService'
import { normalizeMarketplaceListing } from './normalizeMarketplaceListing'
import {
  evaluateNormalizedHunterListings,
  type HunterListingEvaluationFailure,
  type HunterListingIntelligence,
  type ListingDealEstimateOverrides,
} from './evaluateNormalizedHunterListings'

export type {
  HunterListingEvaluationFailure,
  HunterListingIntelligence,
  ListingDealEstimateOverrides,
} from './evaluateNormalizedHunterListings'

export interface HunterDiscoveryIntelligenceResult {
  hunterId: string
  listings: NormalizedListing[]
  evaluations: HunterListingIntelligence[]
  evaluationFailures: HunterListingEvaluationFailure[]
  discoverySuccesses: DiscoverySourceSuccess[]
  discoveryFailures: DiscoverySourceFailure[]
  planningErrors: string[]
}

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

  const {
    evaluations,
    evaluationFailures,
  } = await evaluateNormalizedHunterListings(
    hunter,
    listings,
    evaluationService,
    overridesByListingId,
  )

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
