import type { DiscoveryRequest } from '../../domain/discovery/DiscoveryRequest'
import { UserMediatedMarketplaceAdapter } from './userMediatedMarketplaceAdapter'

const request: DiscoveryRequest = {
  hunterId: 'hunter-user-mediated',
  source: 'facebook_marketplace',
  location: {
    postalCode: '33578',
    radiusMiles: 50,
  },
  categories: ['vehicles'],
}

const submission = {
  source: 'facebook_marketplace',
  submittedAt: '2026-08-21T16:30:00.000Z',
  listings: [
    {
      sourceListingId: 'fb-user-001',
      url: 'https://example.test/fb-user-001',
      title: '2008 Mazda3',
      description: 'Runs and drives',
      askingPrice: 2900,
      locationText: 'Tampa, FL',
      postedAt: '2026-08-18T16:30:00.000Z',
    },
  ],
}

console.log(
  '===== SCENARIO 1 — USER SUBMISSION BECOMES RAW LISTING =====',
)

const adapter =
  new UserMediatedMarketplaceAdapter(
    'facebook_marketplace',
    async () => submission,
  )

const results = await adapter.acquire(request, {
  userAuthorized: true,
  userSessionAvailable: false,
})

if (results.length !== 1) {
  throw new Error(
    `Expected one ingested listing, received ${results.length}`,
  )
}

if (
  results[0]?.sourceListingId !==
  submission.listings[0]?.sourceListingId
) {
  throw new Error(
    'User-submitted listing identity was not preserved.',
  )
}

if (
  results[0]?.discoveredAt !==
  submission.submittedAt
) {
  throw new Error(
    'Submission timestamp was not preserved as discoveredAt.',
  )
}

console.log('PASS')

console.log(
  '===== SCENARIO 2 — AUTHORIZATION IS REQUIRED =====',
)

let unauthorizedRejected = false

try {
  await adapter.acquire(request, {
    userAuthorized: false,
    userSessionAvailable: false,
  })
} catch {
  unauthorizedRejected = true
}

if (!unauthorizedRejected) {
  throw new Error(
    'User-mediated acquisition proceeded without authorization.',
  )
}

console.log('PASS')

console.log(
  '===== SCENARIO 3 — NO SUBMISSION RETURNS EMPTY RESULTS =====',
)

const emptyAdapter =
  new UserMediatedMarketplaceAdapter(
    'facebook_marketplace',
    () => null,
  )

const emptyResults =
  await emptyAdapter.acquire(request, {
    userAuthorized: true,
    userSessionAvailable: false,
  })

if (emptyResults.length !== 0) {
  throw new Error(
    'Missing user submission should return no listings.',
  )
}

console.log('PASS')

console.log(
  '===== SCENARIO 4 — SUBMISSION SOURCE MISMATCH IS REJECTED =====',
)

const mismatchedAdapter =
  new UserMediatedMarketplaceAdapter(
    'facebook_marketplace',
    () => ({
      ...submission,
      source: 'craigslist',
    }),
  )

let mismatchRejected = false

try {
  await mismatchedAdapter.acquire(request, {
    userAuthorized: true,
    userSessionAvailable: false,
  })
} catch {
  mismatchRejected = true
}

if (!mismatchRejected) {
  throw new Error(
    'Mismatched user-submitted source was accepted.',
  )
}

console.log('PASS')

console.log(
  '===== SCENARIO 5 — CAPABILITY DOES NOT CLAIM BACKGROUND ACCESS =====',
)

if (
  adapter.capability.acquisitionMode !==
    'user_mediated' ||
  adapter.capability.supportsBackgroundDiscovery
) {
  throw new Error(
    'User-mediated adapter falsely claims background acquisition.',
  )
}

console.log('PASS')

console.log()
console.log(
  '===== USER-MEDIATED MARKETPLACE ADAPTER PASSED =====',
)
