import type { DiscoveryRequest } from '../../domain/discovery/DiscoveryRequest'
import type { UserMediatedListingSubmission } from './userMediatedMarketplaceAdapter'
import { InMemoryUserMediatedSubmissionStore } from './inMemoryUserMediatedSubmissionStore'
import { createMarketplaceAcquisitionRequestForTest } from './createMarketplaceAcquisitionRequestForTest'

const facebookRequest: DiscoveryRequest = {
  hunterId: 'hunter-alpha',
  source: 'facebook_marketplace',
  location: {
    postalCode: '33578',
    radiusMiles: 50,
  },
  categories: ['vehicles'],
}

const craigslistRequest: DiscoveryRequest = {
  ...facebookRequest,
  source: 'craigslist',
}

const secondHunterRequest: DiscoveryRequest = {
  ...facebookRequest,
  hunterId: 'hunter-beta',
}

const facebookSubmission: UserMediatedListingSubmission = {
  source: 'facebook_marketplace',
  submittedAt: '2026-08-21T17:00:00.000Z',
  listings: [
    {
      sourceListingId: 'fb-001',
      url: 'https://example.test/fb-001',
      title: '2008 Mazda3',
      askingPrice: 2900,
    },
  ],
}

const replacementSubmission: UserMediatedListingSubmission = {
  source: 'facebook_marketplace',
  submittedAt: '2026-08-21T17:05:00.000Z',
  listings: [
    {
      sourceListingId: 'fb-002',
      url: 'https://example.test/fb-002',
      title: '2004 Toyota Camry',
      askingPrice: 3200,
    },
  ],
}

const craigslistSubmission: UserMediatedListingSubmission = {
  source: 'craigslist',
  submittedAt: '2026-08-21T17:10:00.000Z',
  listings: [
    {
      sourceListingId: 'cl-001',
      url: 'https://example.test/cl-001',
      title: '2011 Honda Accord',
      askingPrice: 3500,
    },
  ],
}

const store = new InMemoryUserMediatedSubmissionStore()

console.log(
  '===== SCENARIO 1 — MISSING SUBMISSION RETURNS NULL =====',
)

if (store.resolve(createMarketplaceAcquisitionRequestForTest(facebookRequest)) !== null) {
  throw new Error('Missing submission did not return null.')
}

console.log('PASS')

console.log(
  '===== SCENARIO 2 — SUBMISSION RESOLVES BY HUNTER AND SOURCE =====',
)

store.submit('hunter-alpha', facebookSubmission)

const storedFacebook = store.resolve(createMarketplaceAcquisitionRequestForTest(facebookRequest))

if (
  storedFacebook?.listings[0]?.sourceListingId !==
  'fb-001'
) {
  throw new Error('Facebook submission was not resolved.')
}

if (store.resolve(createMarketplaceAcquisitionRequestForTest(craigslistRequest)) !== null) {
  throw new Error(
    'Facebook submission leaked into Craigslist.',
  )
}

if (store.resolve(createMarketplaceAcquisitionRequestForTest(secondHunterRequest)) !== null) {
  throw new Error(
    'Submission leaked into another Hunter.',
  )
}

console.log('PASS')

console.log(
  '===== SCENARIO 3 — REPLACEMENT IS DETERMINISTIC =====',
)

store.submit('hunter-alpha', replacementSubmission)

const replaced = store.resolve(createMarketplaceAcquisitionRequestForTest(facebookRequest))

if (
  replaced?.listings.length !== 1 ||
  replaced.listings[0]?.sourceListingId !== 'fb-002'
) {
  throw new Error(
    'Replacement submission was not authoritative.',
  )
}

console.log('PASS')

console.log(
  '===== SCENARIO 4 — STORED DATA IS MUTATION SAFE =====',
)

const mutableInput: UserMediatedListingSubmission = {
  source: 'facebook_marketplace',
  submittedAt: '2026-08-21T17:15:00.000Z',
  listings: [
    {
      sourceListingId: 'safe-001',
      url: 'https://example.test/safe-001',
      title: 'Original title',
      askingPrice: 2500,
    },
  ],
}

store.submit('hunter-beta', mutableInput)

mutableInput.listings[0]!.title = 'Mutated outside store'

const firstRead = store.resolve(createMarketplaceAcquisitionRequestForTest(secondHunterRequest))

if (
  firstRead?.listings[0]?.title !== 'Original title'
) {
  throw new Error(
    'Input mutation leaked into submission store.',
  )
}

firstRead.listings[0]!.title = 'Mutated returned value'

const secondRead = store.resolve(createMarketplaceAcquisitionRequestForTest(secondHunterRequest))

if (
  secondRead?.listings[0]?.title !== 'Original title'
) {
  throw new Error(
    'Resolved mutation leaked back into submission store.',
  )
}

console.log('PASS')

console.log(
  '===== SCENARIO 5 — SOURCES REMAIN INDEPENDENT =====',
)

store.submit('hunter-alpha', craigslistSubmission)

if (
  store.resolve(createMarketplaceAcquisitionRequestForTest(facebookRequest))?.listings[0]
    ?.sourceListingId !== 'fb-002'
) {
  throw new Error(
    'Craigslist submission replaced Facebook submission.',
  )
}

if (
  store.resolve(createMarketplaceAcquisitionRequestForTest(craigslistRequest))?.listings[0]
    ?.sourceListingId !== 'cl-001'
) {
  throw new Error(
    'Craigslist submission was not stored independently.',
  )
}

console.log('PASS')

console.log(
  '===== SCENARIO 6 — CLEAR REMOVES ONLY TARGET SOURCE =====',
)

store.clear('hunter-alpha', 'facebook_marketplace')

if (store.resolve(createMarketplaceAcquisitionRequestForTest(facebookRequest)) !== null) {
  throw new Error(
    'Target Facebook submission was not cleared.',
  )
}

if (store.resolve(createMarketplaceAcquisitionRequestForTest(craigslistRequest)) === null) {
  throw new Error(
    'Clearing Facebook incorrectly removed Craigslist.',
  )
}

console.log('PASS')

console.log(
  '===== SCENARIO 7 — CLEAR HUNTER REMOVES ALL HUNTER SOURCES =====',
)

store.submit('hunter-alpha', facebookSubmission)
store.clearHunter('hunter-alpha')

if (
  store.resolve(createMarketplaceAcquisitionRequestForTest(facebookRequest)) !== null ||
  store.resolve(createMarketplaceAcquisitionRequestForTest(craigslistRequest)) !== null
) {
  throw new Error(
    'clearHunter did not remove every Hunter submission.',
  )
}

if (store.resolve(createMarketplaceAcquisitionRequestForTest(secondHunterRequest)) === null) {
  throw new Error(
    'clearHunter removed another Hunter submission.',
  )
}

console.log('PASS')

console.log(
  '===== SCENARIO 8 — RESOLVER CONNECTS TO ADAPTER CONTRACT =====',
)

const resolver = store.createResolver()
const resolvedThroughContract =
  await resolver(createMarketplaceAcquisitionRequestForTest(secondHunterRequest))

if (
  resolvedThroughContract?.listings[0]
    ?.sourceListingId !== 'safe-001'
) {
  throw new Error(
    'Submission resolver did not expose stored submission.',
  )
}

console.log('PASS')

console.log()
console.log(
  '===== IN-MEMORY USER SUBMISSION STORE PASSED =====',
)
