import type { DiscoveryRequest } from '../../domain/discovery/DiscoveryRequest'
import { createUserMediatedDiscovery } from './createUserMediatedDiscovery'

const facebookRequest: DiscoveryRequest = {
  hunterId: 'hunter-production-compose',
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

console.log(
  '===== SCENARIO 1 — EMPTY STORE PRODUCES NO LISTINGS =====',
)

const composition =
  createUserMediatedDiscovery()

const emptyFacebook =
  await composition.discoveryService.discover(
    facebookRequest,
  )

if (emptyFacebook.length !== 0) {
  throw new Error(
    'Empty production submission store returned listings.',
  )
}

console.log('PASS')

console.log(
  '===== SCENARIO 2 — FACEBOOK SUBMISSION FLOWS THROUGH PRODUCTION PROVIDER =====',
)

composition.submissionStore.submit(
  facebookRequest.hunterId,
  {
    source: 'facebook_marketplace',
    submittedAt: '2026-08-21T17:30:00.000Z',
    listings: [
      {
        sourceListingId: 'production-fb-001',
        url: 'https://example.test/production-fb-001',
        title: '2010 Toyota Camry',
        askingPrice: 3100,
        locationText: 'Tampa, FL',
      },
    ],
  },
)

const facebookResults =
  await composition.discoveryService.discover(
    facebookRequest,
  )

if (
  facebookResults.length !== 1 ||
  facebookResults[0]?.sourceListingId !==
    'production-fb-001'
) {
  throw new Error(
    'Facebook user submission did not flow through production discovery.',
  )
}

console.log('PASS')

console.log(
  '===== SCENARIO 3 — CRAIGSLIST SOURCE REMAINS INDEPENDENT =====',
)

const emptyCraigslist =
  await composition.discoveryService.discover(
    craigslistRequest,
  )

if (emptyCraigslist.length !== 0) {
  throw new Error(
    'Facebook submission leaked into Craigslist discovery.',
  )
}

composition.submissionStore.submit(
  craigslistRequest.hunterId,
  {
    source: 'craigslist',
    submittedAt: '2026-08-21T17:35:00.000Z',
    listings: [
      {
        sourceListingId: 'production-cl-001',
        url: 'https://example.test/production-cl-001',
        title: '2012 Honda Accord',
        askingPrice: 3400,
        locationText: 'Tampa, FL',
      },
    ],
  },
)

const craigslistResults =
  await composition.discoveryService.discover(
    craigslistRequest,
  )

if (
  craigslistResults.length !== 1 ||
  craigslistResults[0]?.sourceListingId !==
    'production-cl-001'
) {
  throw new Error(
    'Craigslist user submission did not flow through production discovery.',
  )
}

console.log('PASS')

console.log(
  '===== SCENARIO 4 — CLEAR IMMEDIATELY AFFECTS DISCOVERY =====',
)

composition.submissionStore.clear(
  facebookRequest.hunterId,
  'facebook_marketplace',
)

const clearedFacebook =
  await composition.discoveryService.discover(
    facebookRequest,
  )

if (clearedFacebook.length !== 0) {
  throw new Error(
    'Cleared Facebook submission remained discoverable.',
  )
}

const preservedCraigslist =
  await composition.discoveryService.discover(
    craigslistRequest,
  )

if (preservedCraigslist.length !== 1) {
  throw new Error(
    'Clearing Facebook incorrectly removed Craigslist submission.',
  )
}

console.log('PASS')

console.log(
  '===== SCENARIO 5 — COMPOSITIONS ARE INSTANCE ISOLATED =====',
)

const secondComposition =
  createUserMediatedDiscovery()

const secondResults =
  await secondComposition.discoveryService.discover(
    craigslistRequest,
  )

if (secondResults.length !== 0) {
  throw new Error(
    'Production discovery compositions leaked submission state.',
  )
}

console.log('PASS')

console.log()
console.log(
  '===== USER-MEDIATED PRODUCTION DISCOVERY COMPOSITION PASSED =====',
)
