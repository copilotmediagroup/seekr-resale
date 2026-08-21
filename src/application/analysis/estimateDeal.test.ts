import type {
  DealEstimateField,
  MonetaryEstimate,
} from '../../domain/analysis/DealEstimate'
import type {
  DealEstimateProvider,
  DealEstimationContext,
} from '../../domain/analysis/DealEstimator'
import type { NormalizedListing } from '../../domain/discovery/NormalizedListing'
import type { Hunter } from '../../domain/hunters/Hunter'
import {
  DealEstimationService,
} from './estimateDeal'

class DeterministicEstimateProvider
  implements DealEstimateProvider
{
  readonly field: DealEstimateField
  private readonly value: MonetaryEstimate | null

  constructor(
    field: DealEstimateField,
    value: MonetaryEstimate | null,
  ) {
    this.field = field
    this.value = value
  }

  async estimate(
    context: DealEstimationContext,
  ): Promise<MonetaryEstimate | null> {
    void context
    return this.value
      ? { ...this.value }
      : null
  }
}

const listing: NormalizedListing = {
  id: 'facebook_marketplace:estimate-001',
  source: 'facebook_marketplace',
  sourceListingId: 'estimate-001',
  sourceUrl: 'https://example.test/estimate-001',
  title: '2012 Toyota Camry',
  description: 'Runs and drives.',
  askingPrice: 5000,
  locationText: 'Tampa, FL',
  postedAt: '2026-08-07T13:00:00.000Z',
  discoveredAt: '2026-08-21T13:00:00.000Z',
  listingAgeDays: 14,
}

const hunter: Hunter = {
  id: 'hunter-estimation-test',
  name: 'Estimation Test Hunter',
  enabled: true,
  location: {
    postalCode: '33578',
    radiusMiles: 50,
  },
  categories: ['vehicles'],
  sources: ['facebook_marketplace'],
  thresholds: {
    minimumSpend: null,
    maximumSpend: null,
    minimumExpectedProfit: null,
    minimumRoiPercent: null,
    minimumSeekrScore: null,
  },
}

const provider = (
  field: DealEstimateField,
  amount: number,
): DealEstimateProvider =>
  new DeterministicEstimateProvider(field, {
    amount,
    confidence: 'medium',
    origin: 'provider',
    basis: `Deterministic ${field} estimate.`,
  })

console.log(
  '===== SCENARIO 1 — COMPLETE PROVIDER ESTIMATION =====',
)

const completeService = new DealEstimationService([
  provider('estimatedResaleValue', 7500),
  provider('expectedPurchasePrice', 4000),
  provider('estimatedRepairCost', 500),
  provider('estimatedTransportCost', 100),
  provider('estimatedTaxesAndRegistration', 250),
  provider('estimatedTransactionFees', 50),
  provider('estimatedOtherCosts', 100),
])

const completeResult = await completeService.estimate({
  listing,
  hunter,
})

if (!completeResult.complete) {
  throw new Error(
    `Expected complete estimation, missing: ${completeResult.missing.join(', ')}`,
  )
}

if (completeResult.missing.length !== 0) {
  throw new Error(
    'Complete provider set unexpectedly reported missing fields',
  )
}

if (
  completeResult.estimates.estimatedResaleValue?.amount !==
  7500
) {
  throw new Error(
    'Provider resale estimate was not preserved',
  )
}

console.log('PASS')

console.log()
console.log(
  '===== SCENARIO 2 — MISSING PROVIDERS REMAIN NULL =====',
)

const incompleteService = new DealEstimationService([
  provider('estimatedResaleValue', 7500),
  provider('expectedPurchasePrice', 4000),
])

const incompleteResult =
  await incompleteService.estimate({
    listing,
    hunter,
  })

if (incompleteResult.complete) {
  throw new Error(
    'Incomplete provider set was incorrectly marked complete',
  )
}

for (const field of [
  'estimatedRepairCost',
  'estimatedTransportCost',
  'estimatedTaxesAndRegistration',
  'estimatedTransactionFees',
  'estimatedOtherCosts',
] as const) {
  if (!incompleteResult.missing.includes(field)) {
    throw new Error(
      `Missing field not reported: ${field}`,
    )
  }

  if (incompleteResult.estimates[field] !== null) {
    throw new Error(
      `Missing field ${field} was silently assigned a value`,
    )
  }
}

console.log('PASS')

console.log()
console.log(
  '===== SCENARIO 3 — USER OVERRIDE WINS =====',
)

const overrideResult =
  await completeService.estimate({
    listing,
    hunter,
    overrides: {
      expectedPurchasePrice: {
        amount: 3600,
        confidence: 'high',
        origin: 'automated',
        basis: 'User negotiated directly with seller.',
      },
      estimatedRepairCost: {
        amount: 275,
        confidence: 'high',
        origin: 'provider',
        basis: 'User entered mechanic quote.',
      },
    },
  })

if (
  overrideResult.estimates.expectedPurchasePrice
    ?.amount !== 3600
) {
  throw new Error(
    'User purchase-price override did not win',
  )
}

if (
  overrideResult.estimates.expectedPurchasePrice
    ?.origin !== 'user'
) {
  throw new Error(
    'Purchase-price override origin was not normalized to user',
  )
}

if (
  overrideResult.estimates.estimatedRepairCost
    ?.amount !== 275
) {
  throw new Error(
    'User repair-cost override did not win',
  )
}

if (
  overrideResult.estimates.estimatedRepairCost
    ?.origin !== 'user'
) {
  throw new Error(
    'Repair-cost override origin was not normalized to user',
  )
}

console.log('PASS')

console.log()
console.log(
  '===== SCENARIO 4 — NULL PROVIDER RESULT STAYS NULL =====',
)

const nullProviderService =
  new DealEstimationService([
    new DeterministicEstimateProvider(
      'estimatedRepairCost',
      null,
    ),
  ])

const nullProviderResult =
  await nullProviderService.estimate({
    listing,
    hunter,
  })

if (
  nullProviderResult.estimates
    .estimatedRepairCost !== null
) {
  throw new Error(
    'Null provider estimate was replaced with invented data',
  )
}

if (
  !nullProviderResult.missing.includes(
    'estimatedRepairCost',
  )
) {
  throw new Error(
    'Null provider estimate was not reported missing',
  )
}

console.log('PASS')

console.log()
console.log(
  '===== SCENARIO 5 — DUPLICATE FIELD PROVIDERS REJECTED =====',
)

let duplicateRejected = false

try {
  new DealEstimationService([
    provider('estimatedRepairCost', 500),
    provider('estimatedRepairCost', 600),
  ])
} catch {
  duplicateRejected = true
}

if (!duplicateRejected) {
  throw new Error(
    'Duplicate providers for one estimate field were accepted',
  )
}

console.log('PASS')

console.log()
console.log(
  '===== ALL ESTIMATION ORCHESTRATOR SCENARIOS PASSED =====',
)
