import type { VehicleListingMetadata } from '../discovery/VehicleListingMetadata'
import type { VehicleMarketComparable } from './VehicleMarketComparable'
import { estimateVehicleMarketValue } from './estimateVehicleMarketValue'

const assert = (
  condition: boolean,
  message: string,
): void => {
  if (!condition) {
    throw new Error(message)
  }
}

const vehicle: VehicleListingMetadata = {
  year: 2012,
  make: 'Toyota',
  model: 'Camry',
  trim: 'LE',
  mileage: 145000,
  vin: null,
  condition: 'Good',
}

const comparable = (
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

const run = (): void => {
  console.log(
    '===== SCENARIO 1 — MEDIAN OF ACCEPTED COMPARABLES =====',
  )

  const estimate = estimateVehicleMarketValue({
    vehicle,
    comparables: [
      comparable('1', 7000),
      comparable('2', 7400),
      comparable('3', 7200),
    ],
  })

  assert(
    estimate?.amount === 7200,
    'Expected median market value of 7200.',
  )
  assert(
    estimate?.confidence === 'medium',
    'Three accepted comparables should produce medium confidence.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 2 — WRONG MODEL IS REJECTED =====',
  )

  const wrongModelEstimate = estimateVehicleMarketValue({
    vehicle,
    comparables: [
      comparable('1', 7000, { model: 'Corolla' }),
    ],
  })

  assert(
    wrongModelEstimate === null,
    'Wrong-model evidence must not produce a valuation.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 3 — DISTANT YEAR IS REJECTED =====',
  )

  const distantYearEstimate = estimateVehicleMarketValue({
    vehicle,
    comparables: [
      comparable('1', 7000, { year: 2016 }),
    ],
  })

  assert(
    distantYearEstimate === null,
    'Distant-year evidence must be rejected.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 4 — CONFLICTING KNOWN TRIM IS REJECTED =====',
  )

  const wrongTrimEstimate = estimateVehicleMarketValue({
    vehicle,
    comparables: [
      comparable('1', 7000, { trim: 'XLE' }),
    ],
  })

  assert(
    wrongTrimEstimate === null,
    'Conflicting known trim must be rejected.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 5 — EXTREME MILEAGE DIFFERENCE IS REJECTED =====',
  )

  const mileageEstimate = estimateVehicleMarketValue({
    vehicle,
    comparables: [
      comparable('1', 7000, { mileage: 40000 }),
    ],
  })

  assert(
    mileageEstimate === null,
    'Extreme mileage difference must be rejected.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 6 — PRICE OUTLIER IS REMOVED =====',
  )

  const outlierEstimate = estimateVehicleMarketValue({
    vehicle,
    comparables: [
      comparable('1', 6900),
      comparable('2', 7000),
      comparable('3', 7100),
      comparable('4', 20000),
      comparable('5', 7200),
    ],
  })

  assert(
    outlierEstimate?.amount === 7050,
    'Extreme price outlier should not distort the median.',
  )
  assert(
    outlierEstimate?.confidence === 'medium',
    'Four accepted post-outlier comparables should be medium confidence.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 7 — FIVE COMPARABLES PRODUCE HIGH CONFIDENCE =====',
  )

  const highConfidenceEstimate = estimateVehicleMarketValue({
    vehicle,
    comparables: [
      comparable('1', 6800),
      comparable('2', 6900),
      comparable('3', 7000),
      comparable('4', 7100),
      comparable('5', 7200),
    ],
  })

  assert(
    highConfidenceEstimate?.amount === 7000,
    'Expected median of 7000.',
  )
  assert(
    highConfidenceEstimate?.confidence === 'high',
    'Five accepted comparables should produce high confidence.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 8 — MISSING TARGET IDENTITY RETURNS NULL =====',
  )

  const incompleteVehicleEstimate =
    estimateVehicleMarketValue({
      vehicle: {
        ...vehicle,
        model: null,
      },
      comparables: [
        comparable('1', 7000),
      ],
    })

  assert(
    incompleteVehicleEstimate === null,
    'Incomplete vehicle identity must not produce a valuation.',
  )

  console.log('PASS')
  console.log()
  console.log(
    '===== VEHICLE MARKET VALUE ENGINE TESTS PASSED =====',
  )
}

run()
