import type { RawMarketplaceListing } from '../../domain/discovery/RawMarketplaceListing'
import type {
  Hunter,
  MarketplaceSource,
} from '../../domain/hunters/Hunter'
import { createDiscoveryRequestsForHunter } from './createDiscoveryRequestsForHunter'
import type { DiscoveryService } from './discoveryService'

export interface DiscoverySourceSuccess {
  source: MarketplaceSource
  listings: RawMarketplaceListing[]
}

export interface DiscoverySourceFailure {
  source: MarketplaceSource
  error: string
}

export interface HunterDiscoveryExecutionResult {
  hunterId: string
  listings: RawMarketplaceListing[]
  successes: DiscoverySourceSuccess[]
  failures: DiscoverySourceFailure[]
  planningErrors: string[]
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}

export const executeHunterDiscovery = async (
  hunter: Hunter,
  discoveryService: DiscoveryService,
): Promise<HunterDiscoveryExecutionResult> => {
  const plan = createDiscoveryRequestsForHunter(hunter)

  if (plan.errors.length > 0) {
    return {
      hunterId: hunter.id,
      listings: [],
      successes: [],
      failures: [],
      planningErrors: [...plan.errors],
    }
  }

  const outcomes = await Promise.all(
    plan.requests.map(async (request) => {
      try {
        const listings = await discoveryService.discover(request)

        return {
          status: 'success' as const,
          source: request.source,
          listings,
        }
      } catch (error) {
        return {
          status: 'failure' as const,
          source: request.source,
          error: getErrorMessage(error),
        }
      }
    }),
  )

  const successes: DiscoverySourceSuccess[] = []
  const failures: DiscoverySourceFailure[] = []
  const listings: RawMarketplaceListing[] = []

  for (const outcome of outcomes) {
    if (outcome.status === 'success') {
      successes.push({
        source: outcome.source,
        listings: outcome.listings.map((listing) => ({ ...listing })),
      })

      listings.push(
        ...outcome.listings.map((listing) => ({ ...listing })),
      )

      continue
    }

    failures.push({
      source: outcome.source,
      error: outcome.error,
    })
  }

  return {
    hunterId: hunter.id,
    listings,
    successes,
    failures,
    planningErrors: [],
  }
}
