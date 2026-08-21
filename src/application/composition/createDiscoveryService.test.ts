import type { DiscoveryRequest } from '../../domain/discovery/DiscoveryRequest'
import type { MarketplaceProvider } from '../../domain/discovery/MarketplaceProvider'
import type { RawMarketplaceListing } from '../../domain/discovery/RawMarketplaceListing'
import { createDiscoveryService } from './createDiscoveryService'

class FixedProvider implements MarketplaceProvider {
  readonly source

  private readonly listings: RawMarketplaceListing[]

  constructor(
    source: string,
    listings: RawMarketplaceListing[],
  ) {
    this.source = source
    this.listings = listings.map((listing) => ({ ...listing }))
  }

  async discover(
    request: DiscoveryRequest,
  ): Promise<RawMarketplaceListing[]> {
    if (request.source !== this.source) {
      throw new Error('Provider source mismatch.')
    }

    return this.listings.map((listing) => ({ ...listing }))
  }
}

const listing: RawMarketplaceListing = {
  source: 'craigslist',
  sourceListingId: 'composition-001',
  url: 'https://example.test/composition-001',
  title: '2010 Toyota Corolla',
  description: 'Runs well.',
  askingPrice: 3200,
  locationText: 'Tampa, FL',
  postedAt: '2026-08-20T12:00:00.000Z',
  discoveredAt: '2026-08-21T12:00:00.000Z',
}

const request: DiscoveryRequest = {
  hunterId: 'hunter-composition',
  source: 'craigslist',
  location: {
    postalCode: '33578',
    radiusMiles: 50,
  },
  categories: ['vehicles'],
}

console.log(
  '===== SCENARIO 1 — COMPOSITION REGISTERS PROVIDERS =====',
)

const provider = new FixedProvider(
  'craigslist',
  [listing],
)

const service = createDiscoveryService({
  providers: [provider],
})

const results = await service.discover(request)

if (results.length !== 1) {
  throw new Error(
    `Expected one listing, received ${results.length}`,
  )
}

if (
  results[0]?.sourceListingId !==
  listing.sourceListingId
) {
  throw new Error(
    'Composition did not preserve provider discovery.',
  )
}

console.log('PASS')

console.log(
  '===== SCENARIO 2 — INPUT ARRAY MUTATION DOES NOT CHANGE REGISTRATION =====',
)

const providers: MarketplaceProvider[] = [
  new FixedProvider('craigslist', [listing]),
]

const isolatedService = createDiscoveryService({
  providers,
})

providers.length = 0

const isolatedResults =
  await isolatedService.discover(request)

if (isolatedResults.length !== 1) {
  throw new Error(
    'Discovery composition leaked provider-array mutation.',
  )
}

console.log('PASS')

console.log(
  '===== SCENARIO 3 — UNREGISTERED SOURCE REMAINS REJECTED =====',
)

let rejected = false

try {
  await isolatedService.discover({
    ...request,
    source: 'facebook_marketplace',
  })
} catch {
  rejected = true
}

if (!rejected) {
  throw new Error(
    'Composition silently accepted an unregistered provider.',
  )
}

console.log('PASS')

console.log()
console.log(
  '===== PRODUCTION DISCOVERY COMPOSITION CONTRACT PASSED =====',
)
