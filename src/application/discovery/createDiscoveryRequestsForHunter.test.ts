import { createDiscoveryRequestsForHunter } from './createDiscoveryRequestsForHunter'
import type { Hunter } from '../../domain/hunters/Hunter'

const hunter: Hunter = {
  id: 'hunter-discovery-test',
  name: 'Vehicle Hunter',
  enabled: true,
  location: {
    postalCode: '33578',
    radiusMiles: 35,
  },
  categories: ['vehicles', 'tools'],
  sources: [
    'facebook_marketplace',
    'craigslist',
    'custom-source',
  ],
  thresholds: {
    minimumSpend: 500,
    maximumSpend: 5000,
    minimumExpectedProfit: 1000,
    minimumRoiPercent: 25,
    minimumSeekrScore: 70,
  },
}

const planned = createDiscoveryRequestsForHunter(hunter)

if (planned.errors.length !== 0) {
  console.error(planned.errors)
  throw new Error('Valid Hunter unexpectedly failed discovery planning')
}

if (planned.requests.length !== hunter.sources.length) {
  throw new Error(
    `Expected ${hunter.sources.length} requests, received ${planned.requests.length}`,
  )
}

for (const [index, source] of hunter.sources.entries()) {
  const request = planned.requests[index]

  if (!request) {
    throw new Error(`Missing request at index ${index}`)
  }

  if (request.source !== source) {
    throw new Error(
      `Expected source ${source}, received ${request.source}`,
    )
  }

  if (request.hunterId !== hunter.id) {
    throw new Error('Hunter ID was not preserved')
  }

  if (
    JSON.stringify(request.location) !==
    JSON.stringify(hunter.location)
  ) {
    throw new Error('Hunter location was not preserved')
  }

  if (
    JSON.stringify(request.categories) !==
    JSON.stringify(hunter.categories)
  ) {
    throw new Error('Hunter categories were not preserved')
  }
}

planned.requests[0]!.categories.push('mutated-category')
planned.requests[0]!.location.postalCode = '00000'

if (hunter.categories.includes('mutated-category')) {
  throw new Error('Discovery planning leaked category mutation')
}

if (hunter.location.postalCode !== '33578') {
  throw new Error('Discovery planning leaked location mutation')
}

const disabledResult = createDiscoveryRequestsForHunter({
  ...hunter,
  enabled: false,
})

if (
  disabledResult.requests.length !== 0 ||
  !disabledResult.errors.some((error) =>
    error.includes('enabled'),
  )
) {
  throw new Error('Disabled Hunter was not rejected')
}

const noSourceResult = createDiscoveryRequestsForHunter({
  ...hunter,
  sources: [],
})

if (
  noSourceResult.requests.length !== 0 ||
  !noSourceResult.errors.some((error) =>
    error.includes('marketplace'),
  )
) {
  throw new Error('Hunter with no marketplaces was not rejected')
}

const noCategoryResult = createDiscoveryRequestsForHunter({
  ...hunter,
  categories: [],
})

if (
  noCategoryResult.requests.length !== 0 ||
  !noCategoryResult.errors.some((error) =>
    error.includes('category'),
  )
) {
  throw new Error('Hunter with no categories was not rejected')
}

const noPostalCodeResult = createDiscoveryRequestsForHunter({
  ...hunter,
  location: {
    ...hunter.location,
    postalCode: '   ',
  },
})

if (
  noPostalCodeResult.requests.length !== 0 ||
  !noPostalCodeResult.errors.some((error) =>
    error.includes('postal code'),
  )
) {
  throw new Error('Hunter with no postal code was not rejected')
}

const invalidRadiusResult = createDiscoveryRequestsForHunter({
  ...hunter,
  location: {
    ...hunter.location,
    radiusMiles: 0,
  },
})

if (
  invalidRadiusResult.requests.length !== 0 ||
  !invalidRadiusResult.errors.some((error) =>
    error.includes('radius'),
  )
) {
  throw new Error('Hunter with invalid radius was not rejected')
}

console.log('HUNTER DISCOVERY PLANNING PASSED')
console.log(JSON.stringify(planned.requests, null, 2))
