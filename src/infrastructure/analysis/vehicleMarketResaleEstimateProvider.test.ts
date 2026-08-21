import type { Hunter } from '../../domain/hunters/Hunter'
import type { NormalizedListing } from '../../domain/discovery/NormalizedListing'
import type { VehicleMarketComparable } from '../../domain/valuation/VehicleMarketComparable'
import type {
  VehicleMarketComparableProvider,
  VehicleMarketComparableQuery,
} from '../../domain/valuation/VehicleMarketComparableProvider'
import { DealEstimationService } from '../../application/analysis/estimateDeal'
import { VehicleMarketResaleEstimateProvider } from './vehicleMarketResaleEstimateProvider'

const hunter: Hunter = {
  id: 'hunter-resale-provider',
  name: 'Resale Provider Test',
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
    minimumExpectedProfit: null,
    minimumRoiPercent: null,
    minimumSeekrScore: null,
  },
}

const createListing = (
  withVehicle = true,
): NormalizedListing => ({
  id: 'facebook_marketplace:resale-test',
  source: 'facebook_marketplace',
  sourceListingId: 'resale-test',
  sourceUrl: 'https://example.test/resale-test',
  title: '2012 Toyota Camry LE',
  description: 'Runs and drives.',
  askingPrice: 2500,
  vehicle: withVehicle
    ? {
        year: 2012,
        make: 'Toyota',
        model: 'Camry',
        trim: 'LE',
        mileage: 145000,
        vin: null,
        condition: 'Good',
      }
    : null,
  locationText: 'Tampa, FL',
  postedAt: '2026-08-20T12:00:00.000Z',
  discoveredAt: '2026-08-21T12:00:00.000Z',
  listingAgeDays: 1,
})

const comp = (
  id: string,
  askingPrice: number,
  overrides: Partial<VehicleMarketComparable> = {},
): VehicleMarketComparable => ({
  id,
  source: 'test-market',
  sourceUrl: null,
  year: 2012,
  make: 'Toyota',
  model: 'Camry',
  trim: 'LE',
  mileage: 145000,
  condition: 'Good',
  locationText: 'Tampa, FL',
  askingPrice,
  observedAt: '2026-08-21T16:00:00.000Z',
  ...overrides,
})

const assert = (
  condition: boolean,
  message: string,
): void => {
  if (!condition) {
    throw new Error(message)
  }
}

class RecordingComparableProvider
  implements VehicleMarketComparableProvider
{
  calls = 0
  lastQuery: VehicleMarketComparableQuery | null = null

  private readonly comparables:
    VehicleMarketComparable[]

  constructor(
    comparables: VehicleMarketComparable[],
  ) {
    this.comparables = comparables
  }

  async findComparables(
    query: VehicleMarketComparableQuery,
  ): Promise<VehicleMarketComparable[]> {
    this.calls += 1
    this.lastQuery = query

    return this.comparables.map(
      (comparable) => ({ ...comparable }),
    )
  }
}

const main = async (): Promise<void> => {
  console.log(
    '===== SCENARIO 1 — COMPARABLES PRODUCE RESALE ESTIMATE =====',
  )

  const comparableProvider =
    new RecordingComparableProvider([
      comp('1', 7000),
      comp('2', 7200),
      comp('3', 7400),
    ])

  const provider =
    new VehicleMarketResaleEstimateProvider(
      comparableProvider,
    )

  const estimate = await provider.estimate({
    hunter,
    listing: createListing(),
  })

  assert(
    estimate?.amount === 7200,
    'Comparable-backed provider did not preserve median valuation.',
  )

  assert(
    estimate?.confidence === 'medium',
    'Three accepted comps should preserve medium confidence.',
  )

  assert(
    estimate?.origin === 'automated',
    'Pure valuation provenance should remain automated.',
  )

  assert(
    comparableProvider.calls === 1,
    'Comparable provider should be called exactly once.',
  )

  assert(
    comparableProvider.lastQuery?.locationText ===
      'Tampa, FL',
    'Listing location was not forwarded to comparable provider.',
  )

  assert(
    comparableProvider.lastQuery?.vehicle.model ===
      'Camry',
    'Structured vehicle identity was not forwarded.',
  )

  console.log('PASS')

  console.log(
    '===== SCENARIO 2 — MISSING VEHICLE SKIPS COMPARABLE LOOKUP =====',
  )

  const skippedProvider =
    new RecordingComparableProvider([
      comp('1', 7000),
    ])

  const skipped =
    new VehicleMarketResaleEstimateProvider(
      skippedProvider,
    )

  const missingVehicleEstimate =
    await skipped.estimate({
      hunter,
      listing: createListing(false),
    })

  assert(
    missingVehicleEstimate === null,
    'Missing vehicle metadata must remain null.',
  )

  assert(
    skippedProvider.calls === 0,
    'Comparable provider must not be called without vehicle metadata.',
  )

  console.log('PASS')

  console.log(
    '===== SCENARIO 3 — REJECTED COMPARABLES RETURN NULL =====',
  )

  const rejectedProvider =
    new RecordingComparableProvider([
      comp('1', 7000, {
        model: 'Corolla',
      }),
    ])

  const rejected =
    new VehicleMarketResaleEstimateProvider(
      rejectedProvider,
    )

  const rejectedEstimate =
    await rejected.estimate({
      hunter,
      listing: createListing(),
    })

  assert(
    rejectedEstimate === null,
    'Rejected market evidence must not produce resale value.',
  )

  console.log('PASS')

  console.log(
    '===== SCENARIO 4 — PROVIDER INTEGRATES WITH ESTIMATION SERVICE =====',
  )

  const service =
    new DealEstimationService([
      new VehicleMarketResaleEstimateProvider(
        new RecordingComparableProvider([
          comp('1', 6800),
          comp('2', 7000),
          comp('3', 7200),
        ]),
      ),
    ])

  const result = await service.estimate({
    hunter,
    listing: createListing(),
  })

  assert(
    result.estimates.estimatedResaleValue?.amount ===
      7000,
    'Estimation service did not preserve comparable resale valuation.',
  )

  assert(
    !result.missing.includes(
      'estimatedResaleValue',
    ),
    'Resale field incorrectly remained missing.',
  )

  assert(
    result.missing.includes(
      'expectedPurchasePrice',
    ),
    'Unregistered purchase-price provider was incorrectly satisfied.',
  )

  assert(
    !result.complete,
    'Resale provider alone must not make estimation complete.',
  )

  console.log('PASS')

  console.log(
    '===== SCENARIO 5 — USER RESALE OVERRIDE STILL WINS =====',
  )

  const overrideResult =
    await service.estimate({
      hunter,
      listing: createListing(),
      overrides: {
        estimatedResaleValue: {
          amount: 7600,
          confidence: 'high',
          origin: 'provider',
          basis: 'User-entered expected resale.',
        },
      },
    })

  assert(
    overrideResult.estimates.estimatedResaleValue
      ?.amount === 7600,
    'User resale override did not win.',
  )

  assert(
    overrideResult.estimates.estimatedResaleValue
      ?.origin === 'user',
    'Resale override provenance was not normalized to user.',
  )

  console.log('PASS')

  console.log()
  console.log(
    '===== VEHICLE MARKET RESALE ESTIMATE PROVIDER PASSED =====',
  )
}

await main()
