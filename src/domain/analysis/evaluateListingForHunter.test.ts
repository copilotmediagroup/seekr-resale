import type { NormalizedListing } from '../discovery/NormalizedListing'
import type { Hunter } from '../hunters/Hunter'
import { evaluateListingForHunter } from './evaluateListingForHunter'

const listing: NormalizedListing = {
  id: 'facebook_marketplace:deal-001',
  source: 'facebook_marketplace',
  sourceListingId: 'deal-001',
  sourceUrl: 'https://example.test/deal-001',
  title: '2012 Toyota Camry',
  description: 'Runs and drives.',
  askingPrice: 5000,
  vehicle: null,
  locationText: 'Tampa, FL',
  postedAt: '2026-08-07T13:00:00.000Z',
  discoveredAt: '2026-08-21T13:00:00.000Z',
  listingAgeDays: 14,
}

const createHunter = (): Hunter => ({
  id: 'hunter-e2e',
  name: 'End-to-End Hunter',
  enabled: true,
  location: {
    postalCode: '33578',
    radiusMiles: 50,
  },
  categories: ['vehicles'],
  sources: ['facebook_marketplace'],
  thresholds: {
    minimumSpend: 2000,
    maximumSpend: 4500,
    minimumExpectedProfit: 2000,
    minimumRoiPercent: 40,
    minimumSeekrScore: 80,
  },
})

const qualifiedEvaluation = evaluateListingForHunter({
  hunter: createHunter(),
  listing,
  valuation: {
    estimatedResaleValue: 7500,
  },
  expectedPurchasePrice: 4000,
  estimatedRepairCost: 500,
  estimatedTransportCost: 100,
  estimatedTaxesAndRegistration: 250,
  estimatedTransactionFees: 50,
  estimatedOtherCosts: 100,
})

if (
  qualifiedEvaluation.analysis.status !== 'analyzed'
) {
  throw new Error('Deal was not analyzed')
}

if (
  qualifiedEvaluation.analysis.seekrScore === null
) {
  throw new Error(
    'End-to-end evaluation did not calculate SEEKR score',
  )
}

if (
  qualifiedEvaluation.qualification.status !==
  'qualified'
) {
  throw new Error(
    `Expected qualified deal, received ${qualifiedEvaluation.qualification.status}`,
  )
}

if (
  qualifiedEvaluation.hunterId !== 'hunter-e2e'
) {
  throw new Error('Hunter identity was not preserved')
}

if (
  qualifiedEvaluation.listingId !== listing.id
) {
  throw new Error('Listing identity was not preserved')
}

console.log('===== QUALIFIED END-TO-END DEAL =====')
console.log(
  JSON.stringify(qualifiedEvaluation, null, 2),
)

const strictHunter = createHunter()

strictHunter.thresholds = {
  minimumSpend: 2000,
  maximumSpend: 3500,
  minimumExpectedProfit: 3000,
  minimumRoiPercent: 60,
  minimumSeekrScore: 95,
}

const rejectedEvaluation = evaluateListingForHunter({
  hunter: strictHunter,
  listing,
  valuation: {
    estimatedResaleValue: 7500,
  },
  expectedPurchasePrice: 4000,
  estimatedRepairCost: 500,
  estimatedTransportCost: 100,
  estimatedTaxesAndRegistration: 250,
  estimatedTransactionFees: 50,
  estimatedOtherCosts: 100,
})

if (
  rejectedEvaluation.qualification.status !==
  'rejected'
) {
  throw new Error(
    `Expected rejected deal, received ${rejectedEvaluation.qualification.status}`,
  )
}

const rejectedCriteria =
  rejectedEvaluation.qualification.failures.map(
    (failure) => failure.criterion,
  )

for (const criterion of [
  'maximumSpend',
  'minimumExpectedProfit',
  'minimumRoiPercent',
  'minimumSeekrScore',
] as const) {
  if (!rejectedCriteria.includes(criterion)) {
    throw new Error(
      `Missing expected rejection: ${criterion}`,
    )
  }
}

console.log()
console.log('===== REJECTED END-TO-END DEAL =====')
console.log(
  JSON.stringify(rejectedEvaluation, null, 2),
)

const unrestrictedHunter = createHunter()

unrestrictedHunter.thresholds = {
  minimumSpend: null,
  maximumSpend: null,
  minimumExpectedProfit: null,
  minimumRoiPercent: null,
  minimumSeekrScore: null,
}

const unrestrictedEvaluation =
  evaluateListingForHunter({
    hunter: unrestrictedHunter,
    listing,
    valuation: {
      estimatedResaleValue: 1000,
    },
    expectedPurchasePrice: 5000,
    estimatedRepairCost: 1000,
    estimatedTransportCost: 500,
    estimatedTaxesAndRegistration: 500,
    estimatedTransactionFees: 500,
    estimatedOtherCosts: 500,
  })

if (
  unrestrictedEvaluation.qualification.status !==
  'qualified'
) {
  throw new Error(
    'Hunter with no thresholds must not receive invented restrictions',
  )
}

console.log()
console.log(
  '===== UNRESTRICTED HUNTER REMAINS USER-CONTROLLED =====',
)
console.log(
  JSON.stringify(unrestrictedEvaluation, null, 2),
)

console.log()
console.log(
  '===== END-TO-END HUNTER DEAL EVALUATION PASSED =====',
)
