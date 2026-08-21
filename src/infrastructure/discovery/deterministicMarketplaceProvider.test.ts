import { DiscoveryService } from '../../application/discovery/discoveryService'
import type { DiscoveryRequest } from '../../domain/discovery/DiscoveryRequest'
import type { RawMarketplaceListing } from '../../domain/discovery/RawMarketplaceListing'
import { DeterministicMarketplaceProvider } from './deterministicMarketplaceProvider'

const listing: RawMarketplaceListing = {
  source: 'facebook_marketplace',
  sourceListingId: 'listing-001',
  url: 'https://example.test/listing-001',
  title: '2012 Toyota Camry',
  description: 'Runs and drives.',
  askingPrice: 2400,
  locationText: 'Tampa, FL',
  postedAt: '2026-08-17T14:00:00.000Z',
  discoveredAt: '2026-08-21T13:00:00.000Z',
}

const request: DiscoveryRequest = {
  hunterId: 'hunter-001',
  source: 'facebook_marketplace',
  location: {
    postalCode: '33578',
    radiusMiles: 35,
  },
  categories: ['vehicles'],
}

const provider = new DeterministicMarketplaceProvider(
  'facebook_marketplace',
  [listing],
)

const service = new DiscoveryService([provider])

const results = await service.discover(request)

if (results.length !== 1) {
  throw new Error(
    `Expected exactly one discovery result, received ${results.length}`,
  )
}

if (JSON.stringify(results[0]) !== JSON.stringify(listing)) {
  console.error({ expected: listing, actual: results[0] })
  throw new Error('Discovery result did not preserve raw listing data')
}

results[0].title = 'Mutated outside provider'

const secondResults = await service.discover(request)

if (secondResults[0]?.title !== listing.title) {
  throw new Error('Provider leaked mutable listing state')
}

let missingProviderRejected = false

try {
  await service.discover({
    ...request,
    source: 'craigslist',
  })
} catch {
  missingProviderRejected = true
}

if (!missingProviderRejected) {
  throw new Error('Missing marketplace provider was not rejected')
}

console.log('DISCOVERY CONTRACT PASSED')
console.log(JSON.stringify(secondResults, null, 2))
