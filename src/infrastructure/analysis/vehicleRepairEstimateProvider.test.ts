import type {
  NormalizedListing,
} from '../../domain/discovery/NormalizedListing'
import type {
  Hunter,
} from '../../domain/hunters/Hunter'
import { DealEstimationService } from '../../application/analysis/estimateDeal'
import { VehicleRepairEstimateProvider } from './vehicleRepairEstimateProvider'

const assert = (
  condition: boolean,
  message: string,
): void => {
  if (!condition) {
    throw new Error(message)
  }
}

const hunter: Hunter = {
  id: 'hunter-repair-test',
  name: 'Repair Hunter',
  enabled: true,
  location: {
    postalCode: '33619',
    radiusMiles: null,
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

const listing = (
  condition: string | null,
): NormalizedListing => ({
  id: 'facebook_marketplace:repair-test',
  source: 'facebook_marketplace',
  sourceListingId: 'repair-test',
  sourceUrl: 'https://example.test/repair-test',
  title: '2011 Toyota Camry',
  description: '',
  askingPrice: 2500,
  vehicle: {
    year: 2011,
    make: 'Toyota',
    model: 'Camry',
    trim: null,
    mileage: 150000,
    vin: null,
    condition,
  },
  locationText: 'Tampa, FL',
  postedAt: null,
  discoveredAt: '2026-08-21T20:00:00.000Z',
  listingAgeDays: null,
})

const main = async (): Promise<void> => {
  console.log(
    '===== SCENARIO 1 — CLEAN VEHICLE PRODUCES ZERO REPAIR ESTIMATE =====',
  )

  const provider =
    new VehicleRepairEstimateProvider()

  const clean = await provider.estimate({
    hunter,
    listing: listing(
      'Runs great, no mechanical issues',
    ),
  })

  assert(
    clean?.amount === 0,
    'Clean repair evidence should produce zero.',
  )

  assert(
    clean?.origin === 'automated',
    'Repair assessment should preserve automated provenance.',
  )

  assert(
    clean?.confidence === 'medium',
    'Clean seller-provided repair evidence should remain medium confidence.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 2 — KNOWN ISSUE WITHOUT PRICE REMAINS NULL =====',
  )

  const minor = await provider.estimate({
    hunter,
    listing: listing('Runs but needs brakes'),
  })

  assert(
    minor === null,
    'Unpriced repair issue must remain null.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 3 — MISSING VEHICLE REMAINS NULL =====',
  )

  const noVehicleListing = {
    ...listing(null),
    vehicle: null,
  }

  const missing = await provider.estimate({
    hunter,
    listing: noVehicleListing,
  })

  assert(
    missing === null,
    'Missing vehicle metadata must remain null.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 4 — USER OVERRIDE STILL WINS =====',
  )

  const service =
    new DealEstimationService([
      new VehicleRepairEstimateProvider(),
    ])

  const overrideResult = await service.estimate({
    hunter,
    listing: listing(
      'Runs great, no mechanical issues',
    ),
    overrides: {
      estimatedRepairCost: {
        amount: 450,
        confidence: 'high',
        origin: 'provider',
        basis: 'User-entered repair budget.',
      },
    },
  })

  assert(
    overrideResult.estimates.estimatedRepairCost
      ?.amount === 450,
    'User repair override did not win.',
  )

  assert(
    overrideResult.estimates.estimatedRepairCost
      ?.origin === 'user',
    'User repair override provenance was not normalized.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== VEHICLE REPAIR ESTIMATE PROVIDER PASSED =====',
  )
}

await main()
