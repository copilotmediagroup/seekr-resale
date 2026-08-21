import type { DiscoveryRequest } from '../../domain/discovery/DiscoveryRequest'
import type { MarketplaceProvider } from '../../domain/discovery/MarketplaceProvider'
import type { RawMarketplaceListing } from '../../domain/discovery/RawMarketplaceListing'
import type { Hunter } from '../../domain/hunters/Hunter'
import { DeterministicMarketplaceProvider } from '../../infrastructure/discovery/deterministicMarketplaceProvider'
import { DiscoveryService } from './discoveryService'
import { executeHunterDiscovery } from './executeHunterDiscovery'

const createListing = (
  source: string,
  sourceListingId: string,
  title: string,
): RawMarketplaceListing => ({
  source,
  sourceListingId,
  url: `https://example.test/${sourceListingId}`,
  title,
  description: null,
  askingPrice: 2000,
  locationText: 'Tampa, FL',
  postedAt: '2026-08-20T12:00:00.000Z',
  discoveredAt: '2026-08-21T13:00:00.000Z',
})

const hunter: Hunter = {
  id: 'multi-provider-hunter',
  name: 'Multi Provider Hunter',
  enabled: true,
  location: {
    postalCode: '33578',
    radiusMiles: 40,
  },
  categories: ['vehicles'],
  sources: [
    'facebook_marketplace',
    'craigslist',
    'broken-source',
  ],
  thresholds: {
    minimumSpend: null,
    maximumSpend: null,
    minimumExpectedProfit: null,
    minimumRoiPercent: null,
    minimumSeekrScore: null,
  },
}

const facebookListings = [
  createListing(
    'facebook_marketplace',
    'facebook-001',
    'Facebook Vehicle',
  ),
]

const craigslistListings = [
  createListing(
    'craigslist',
    'craigslist-001',
    'Craigslist Vehicle',
  ),
  createListing(
    'craigslist',
    'craigslist-002',
    'Second Craigslist Vehicle',
  ),
]

class FailingMarketplaceProvider implements MarketplaceProvider {
  readonly source = 'broken-source'

  async discover(
    request: DiscoveryRequest,
  ): Promise<RawMarketplaceListing[]> {
    throw new Error(
      `Intentional provider failure for ${request.source}`,
    )
  }
}

const service = new DiscoveryService([
  new DeterministicMarketplaceProvider(
    'facebook_marketplace',
    facebookListings,
  ),
  new DeterministicMarketplaceProvider(
    'craigslist',
    craigslistListings,
  ),
  new FailingMarketplaceProvider(),
])

const result = await executeHunterDiscovery(hunter, service)

if (result.planningErrors.length !== 0) {
  console.error(result.planningErrors)
  throw new Error('Valid Hunter unexpectedly failed planning')
}

if (result.successes.length !== 2) {
  throw new Error(
    `Expected 2 successful sources, received ${result.successes.length}`,
  )
}

if (result.failures.length !== 1) {
  throw new Error(
    `Expected 1 failed source, received ${result.failures.length}`,
  )
}

if (result.listings.length !== 3) {
  throw new Error(
    `Expected 3 combined listings, received ${result.listings.length}`,
  )
}

if (
  result.failures[0]?.source !== 'broken-source' ||
  !result.failures[0]?.error.includes('Intentional provider failure')
) {
  console.error(result.failures)
  throw new Error('Source-specific provider failure was not preserved')
}

const resultSources = result.listings.map(
  (listing) => listing.source,
)

if (
  !resultSources.includes('facebook_marketplace') ||
  !resultSources.includes('craigslist')
) {
  throw new Error(
    'Successful marketplace listings were lost after partial failure',
  )
}

result.listings[0]!.title = 'Mutated combined result'

if (facebookListings[0]!.title !== 'Facebook Vehicle') {
  throw new Error(
    'Combined discovery result leaked mutation into provider fixture',
  )
}

const disabledResult = await executeHunterDiscovery(
  {
    ...hunter,
    enabled: false,
  },
  service,
)

if (
  disabledResult.planningErrors.length === 0 ||
  disabledResult.successes.length !== 0 ||
  disabledResult.failures.length !== 0 ||
  disabledResult.listings.length !== 0
) {
  console.error(disabledResult)
  throw new Error(
    'Invalid Hunter should stop before provider execution',
  )
}

console.log('MULTI-PROVIDER HUNTER EXECUTION PASSED')
console.log(JSON.stringify(result, null, 2))
