import type { Hunter } from '../../domain/hunters/Hunter'
import type { ListingEconomicsRepository } from '../../domain/listingEconomics/listingEconomicsRepository'
import type { EstimatedDealEvaluationService } from '../analysis/evaluateEstimatedDeal'
import type {
  HunterDiscoveryIntelligenceResult,
} from './evaluateHunterDiscovery'
import {
  evaluateNormalizedHunterListings,
  type ListingDealEstimateOverrides,
} from './evaluateNormalizedHunterListings'
import { executeHunterDiscovery } from './executeHunterDiscovery'
import type { DiscoveryService } from './discoveryService'
import { normalizeMarketplaceListing } from './normalizeMarketplaceListing'

export class HunterIntelligenceService {
  private readonly discoveryService: DiscoveryService
  private readonly evaluationService: EstimatedDealEvaluationService
  private readonly listingEconomics: ListingEconomicsRepository

  constructor(
    discoveryService: DiscoveryService,
    evaluationService: EstimatedDealEvaluationService,
    listingEconomics: ListingEconomicsRepository,
  ) {
    this.discoveryService = discoveryService
    this.evaluationService = evaluationService
    this.listingEconomics = listingEconomics
  }

  async evaluateHunter(
    hunter: Hunter,
  ): Promise<HunterDiscoveryIntelligenceResult> {
    const discovery = await executeHunterDiscovery(
      hunter,
      this.discoveryService,
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

    const overrideEntries = await Promise.all(
      listings.map(async (listing) => {
        const overrides =
          await this.listingEconomics.getByListingId(
            listing.id,
          )

        return [listing.id, overrides] as const
      }),
    )

    const overridesByListingId: ListingDealEstimateOverrides =
      Object.fromEntries(overrideEntries)

    const {
      evaluations,
      evaluationFailures,
    } = await evaluateNormalizedHunterListings(
      hunter,
      listings,
      this.evaluationService,
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
}
