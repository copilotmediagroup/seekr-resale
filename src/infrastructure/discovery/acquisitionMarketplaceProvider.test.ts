import { DiscoveryService } from '../../application/discovery/discoveryService'
import type { DiscoveryRequest } from '../../domain/discovery/DiscoveryRequest'
import type {
  MarketplaceAcquisitionAdapter,
  MarketplaceAcquisitionContext,
} from '../../domain/discovery/MarketplaceAcquisition'
import type { RawMarketplaceListing } from '../../domain/discovery/RawMarketplaceListing'
import { AcquisitionMarketplaceProvider } from './acquisitionMarketplaceProvider'

class DeterministicAcquisitionAdapter
  implements MarketplaceAcquisitionAdapter
{
  readonly source = 'facebook_marketplace'

  readonly capability = {
    source: 'facebook_marketplace',
    acquisitionMode: 'user_mediated',
    automationLevel: 'assisted',
    requiresUserSession: true,
    requiresExplicitAuthorization: true,
    supportsBackgroundDiscovery: false,
  } as const

  private readonly listings: RawMarketplaceListing[]

  constructor(listings: RawMarketplaceListing[]) {
    this.listings = listings.map(
      (listing) => ({ ...listing }),
    )
  }

  async acquire(
    request: DiscoveryRequest,
    context: MarketplaceAcquisitionContext,
  ): Promise<RawMarketplaceListing[]> {
    if (request.source !== this.source) {
      throw new Error('Acquisition source mismatch.')
    }

    if (!context.userAuthorized) {
      throw new Error(
        'Explicit user authorization is required.',
      )
    }

    if (!context.userSessionAvailable) {
      throw new Error(
        'An active user session is required.',
      )
    }

    return this.listings.map(
      (listing) => ({ ...listing }),
    )
  }
}

const listing: RawMarketplaceListing = {
  source: 'facebook_marketplace',
  sourceListingId: 'bridge-001',
  url: 'https://example.test/bridge-001',
  title: '2012 Toyota Camry',
  description: 'Runs and drives.',
  askingPrice: 2500,
      vehicle: null,
  locationText: 'Tampa, FL',
  postedAt: '2026-08-20T13:00:00.000Z',
  discoveredAt: '2026-08-21T13:00:00.000Z',
}

const request: DiscoveryRequest = {
  hunterId: 'hunter-provider-bridge',
  source: 'facebook_marketplace',
  location: {
    postalCode: '33578',
    radiusMiles: 50,
  },
  categories: ['vehicles'],
}

const adapter =
  new DeterministicAcquisitionAdapter([listing])

let resolverCalls = 0

const provider = new AcquisitionMarketplaceProvider(
  adapter,
  async (resolvedRequest) => {
    resolverCalls += 1

    if (resolvedRequest !== request) {
      throw new Error(
        'Provider did not preserve discovery request identity.',
      )
    }

    return {
      userAuthorized: true,
      userSessionAvailable: true,
    }
  },
)

const service = new DiscoveryService([provider])

console.log(
  '===== SCENARIO 1 — ADAPTER FLOWS THROUGH DISCOVERY SERVICE =====',
)

const results = await service.discover(request)

if (resolverCalls !== 1) {
  throw new Error(
    `Expected one acquisition-context resolution, received ${resolverCalls}`,
  )
}

if (results.length !== 1) {
  throw new Error(
    `Expected one discovered listing, received ${results.length}`,
  )
}

if (
  results[0]?.sourceListingId !==
  listing.sourceListingId
) {
  throw new Error(
    'Acquisition listing did not flow through provider bridge.',
  )
}

console.log('PASS')

console.log(
  '===== SCENARIO 2 — RESULT MUTATION DOES NOT LEAK INTO ADAPTER =====',
)

results[0].title = 'Mutated outside bridge'

const secondResults = await service.discover(request)

if (
  secondResults[0]?.title !== listing.title
) {
  throw new Error(
    'Provider bridge leaked mutable listing state.',
  )
}

console.log('PASS')

console.log(
  '===== SCENARIO 3 — CONTEXT RESOLVER CAN BLOCK ACQUISITION =====',
)

const blockedProvider =
  new AcquisitionMarketplaceProvider(
    adapter,
    () => ({
      userAuthorized: false,
      userSessionAvailable: true,
    }),
  )

const blockedService =
  new DiscoveryService([blockedProvider])

let blocked = false

try {
  await blockedService.discover(request)
} catch {
  blocked = true
}

if (!blocked) {
  throw new Error(
    'Provider bridge allowed acquisition without authorization.',
  )
}

console.log('PASS')

console.log(
  '===== SCENARIO 4 — SOURCE MISMATCH IS REJECTED =====',
)

let mismatchRejected = false

try {
  await provider.discover({
    ...request,
    source: 'craigslist',
  })
} catch {
  mismatchRejected = true
}

if (!mismatchRejected) {
  throw new Error(
    'Provider bridge accepted a mismatched source.',
  )
}

console.log('PASS')

console.log()
console.log(
  '===== ACQUISITION MARKETPLACE PROVIDER BRIDGE PASSED =====',
)
