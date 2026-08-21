import type { Hunter } from '../../domain/hunters/Hunter'
import { evaluateHunterDiscovery } from '../discovery/evaluateHunterDiscovery'
import { createHunterRuntime } from './createHunterRuntime'

const hunter: Hunter = {
  id: 'hunter-runtime-test',
  name: 'Hunter Runtime Test',
  enabled: true,
  location: {
    postalCode: '33619',
    radiusMiles: 25,
  },
  categories: ['vehicles'],
  sources: ['facebook_marketplace'],
  thresholds: {
    minimumSpend: null,
    maximumSpend: null,
    minimumExpectedProfit: 1000,
    minimumRoiPercent: 20,
    minimumSeekrScore: 70,
  },
}

const assert = (
  condition: boolean,
  message: string,
): void => {
  if (!condition) {
    throw new Error(message)
  }
}

const main = async (): Promise<void> => {
  console.log(
    '===== SCENARIO 1 — USER SUBMISSION FLOWS THROUGH COMPLETE RUNTIME =====',
  )

  const runtime = createHunterRuntime()

  runtime.discovery.submissionStore.submit(
    hunter.id,
    {
      source: 'facebook_marketplace',
      submittedAt: '2026-08-21T12:00:00.000Z',
      listings: [
        {
          sourceListingId: 'runtime-001',
          url: 'https://example.test/runtime-001',
          title: '  2012 Toyota Camry  ',
          description: '  Runs and drives.  ',
          askingPrice: 2500,
          vehicle: {
            year: 2012,
            make: 'Toyota',
            model: 'Camry',
            trim: null,
            mileage: 150000,
            vin: null,
            condition: 'Runs great, no mechanical issues',
          },
          locationText: '  Tampa, FL  ',
          postedAt: '2026-08-20T12:00:00.000Z',
        },
      ],
    },
  )

  runtime.discovery.submissionStore.submit(
    hunter.id,
    {
      source: 'facebook_marketplace',
      submittedAt: '2026-08-21T12:05:00.000Z',
      listings: [
        {
          sourceListingId: 'runtime-001',
          url: 'https://example.test/runtime-001',
          title: '2012 Toyota Camry',
          description: 'Runs and drives.',
          askingPrice: 2500,
          vehicle: {
            year: 2012,
            make: 'Toyota',
            model: 'Camry',
            trim: null,
            mileage: 150000,
            vin: null,
            condition: 'Runs great, no mechanical issues',
          },
          locationText: 'Tampa, FL',
          postedAt: '2026-08-20T12:00:00.000Z',
        },
        {
          sourceListingId: 'runtime-comp-001',
          url: 'https://example.test/runtime-comp-001',
          title: '2012 Toyota Camry',
          description: '',
          askingPrice: 6900,
          vehicle: {
            year: 2012,
            make: 'Toyota',
            model: 'Camry',
            trim: null,
            mileage: 148000,
            vin: null,
            condition: 'Good',
          },
          locationText: 'Tampa, FL',
          postedAt: '2026-08-19T12:00:00.000Z',
        },
        {
          sourceListingId: 'runtime-comp-002',
          url: 'https://example.test/runtime-comp-002',
          title: '2012 Toyota Camry',
          description: '',
          askingPrice: 7200,
          vehicle: {
            year: 2012,
            make: 'Toyota',
            model: 'Camry',
            trim: null,
            mileage: 152000,
            vin: null,
            condition: 'Good',
          },
          locationText: 'Tampa, FL',
          postedAt: '2026-08-18T12:00:00.000Z',
        },
        {
          sourceListingId: 'runtime-comp-003',
          url: 'https://example.test/runtime-comp-003',
          title: '2012 Toyota Camry',
          description: '',
          askingPrice: 7500,
          vehicle: {
            year: 2012,
            make: 'Toyota',
            model: 'Camry',
            trim: null,
            mileage: 155000,
            vin: null,
            condition: 'Good',
          },
          locationText: 'Tampa, FL',
          postedAt: '2026-08-17T12:00:00.000Z',
        },
      ],
    },
  )

  const result = await evaluateHunterDiscovery(
    hunter,
    runtime.discovery.discoveryService,
    runtime.evaluation.evaluationService,
  )

  assert(
    result.planningErrors.length === 0,
    'Valid runtime Hunter unexpectedly produced planning errors.',
  )

  assert(
    result.discoverySuccesses.length === 1,
    'Expected one successful runtime discovery source.',
  )

  assert(
    result.discoveryFailures.length === 0,
    'Expected zero runtime discovery failures.',
  )

  assert(
    result.listings.length === 4,
    'Expected subject listing plus three runtime comparables.',
  )

  assert(
    result.listings[0]?.title === '2012 Toyota Camry',
    'Runtime listing did not flow through normalization.',
  )

  assert(
    result.listings[0]?.locationText === 'Tampa, FL',
    'Runtime listing location did not flow through normalization.',
  )

  assert(
    result.evaluations.length === 4,
    'Expected four runtime evaluations.',
  )

  assert(
    result.evaluationFailures.length === 0,
    'Runtime listing unexpectedly failed evaluation.',
  )

  const subjectIntelligence =
    result.evaluations.find(
      ({ listing }) =>
        listing.sourceListingId === 'runtime-001',
    )

  assert(
    subjectIntelligence !== undefined,
    'Expected runtime subject listing evaluation.',
  )

  const evaluation =
    subjectIntelligence?.evaluation

  assert(
    evaluation?.status === 'pending_estimates',
    'Production runtime must remain pending until remaining cost estimates exist.',
  )

  if (evaluation?.status !== 'pending_estimates') {
    throw new Error(
      'Expected pending_estimates runtime evaluation.',
    )
  }

  assert(
    !evaluation.estimation.complete,
    'Production runtime must remain incomplete while five cost estimates are missing.',
  )

  assert(
    evaluation.estimation.estimates.expectedPurchasePrice?.amount === 2500,
    'Production runtime did not derive expected purchase price from listing asking price.',
  )

  assert(
    evaluation.estimation.estimates.expectedPurchasePrice?.origin ===
      'provider',
    'Production asking-price estimate did not preserve provider provenance.',
  )

  assert(
    evaluation.estimation.estimates.estimatedResaleValue?.amount ===
      7200,
    'Production runtime did not derive the expected market resale median.',
  )

  assert(
    evaluation.estimation.estimates.estimatedResaleValue?.origin ===
      'automated',
    'Production resale estimate did not preserve automated market provenance.',
  )

  assert(
    !evaluation.estimation.missing.includes(
      'expectedPurchasePrice',
    ),
    'Expected purchase price remained incorrectly marked missing.',
  )

  assert(
    !evaluation.estimation.missing.includes(
      'estimatedResaleValue',
    ),
    'Estimated resale value remained incorrectly marked missing.',
  )

  assert(
    evaluation.estimation.estimates.estimatedRepairCost
      ?.amount === 0,
    'Production runtime did not derive zero known repair cost from clean condition evidence.',
  )

  assert(
    evaluation.estimation.estimates.estimatedRepairCost
      ?.origin === 'automated',
    'Production repair estimate did not preserve automated provenance.',
  )

  assert(
    !evaluation.estimation.missing.includes(
      'estimatedRepairCost',
    ),
    'Estimated repair cost remained incorrectly marked missing.',
  )

  assert(
    evaluation.estimation.missing.length === 4,
    `Expected exactly 4 remaining estimates, received ${evaluation.estimation.missing.length}.`,
  )

  assert(
    evaluation.estimation.estimates.estimatedTransportCost ===
      null,
    'Production runtime must not invent transport cost without a user-controlled quote.',
  )

  assert(
    evaluation.estimation.missing.includes(
      'estimatedTransportCost',
    ),
    'Production runtime must report transport cost missing when no user-controlled quote exists.',
  )

  for (const field of [
    'estimatedTransportCost',
    'estimatedTaxesAndRegistration',
    'estimatedTransactionFees',
    'estimatedOtherCosts',
  ] as const) {
    assert(
      evaluation.estimation.missing.includes(field),
      `Production runtime incorrectly satisfied missing field: ${field}.`,
    )
  }

  assert(
    evaluation.evaluation.analysis.economics === null,
    'Production runtime must not fabricate economics.',
  )

  assert(
    evaluation.evaluation.analysis.seekrScore === null,
    'Production runtime must not fabricate SEEKR Score.',
  )

  console.log('PASS')

  console.log()
  console.log(
    '===== COMPLETE HUNTER RUNTIME COMPOSITION PASSED =====',
  )
}

await main()
