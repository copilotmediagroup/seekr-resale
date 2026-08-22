import type { VehicleMarketComparable } from './VehicleMarketComparable'
import type {
  VehicleMarketComparableProvider,
  VehicleMarketComparableQuery,
} from './VehicleMarketComparableProvider'

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
  lastQuery: VehicleMarketComparableQuery | null = null

  async findComparables(
    query: VehicleMarketComparableQuery,
  ): Promise<VehicleMarketComparable[]> {
    this.lastQuery = query

    return [
      {
        id: 'comp-001',
        source: 'test-market',
        sourceUrl: 'https://example.test/comp-001',
        year: 2012,
        make: 'Toyota',
        model: 'Camry',
        trim: 'LE',
        mileage: 142000,
        condition: 'Good',
        locationText: 'Tampa, FL',
        askingPrice: 7200,
        observedAt: '2026-08-21T16:00:00.000Z',
      },
    ]
  }
}

const run = async (): Promise<void> => {
  console.log(
    '===== SCENARIO 1 — STRUCTURED VEHICLE QUERY REACHES PROVIDER =====',
  )

  const provider = new RecordingComparableProvider()

  const query: VehicleMarketComparableQuery = {
    hunterId: 'hunter-test-001',
    targetListingId: null,
    vehicle: {
      year: 2012,
      make: 'Toyota',
      model: 'Camry',
      trim: 'LE',
      mileage: 145000,
      vin: null,
      condition: 'Good',
    },
    locationText: 'Tampa, FL',
  }

  const comparables =
    await provider.findComparables(query)

  assert(
    provider.lastQuery === query,
    'Provider should receive the structured comparable query.',
  )

  assert(
    comparables.length === 1,
    'Provider should return comparable evidence.',
  )

  assert(
    comparables[0].askingPrice === 7200,
    'Comparable should preserve observed market price.',
  )

  assert(
    comparables[0].mileage === 142000,
    'Comparable should preserve mileage evidence.',
  )

  assert(
    comparables[0].source === 'test-market',
    'Comparable should preserve source provenance.',
  )

  console.log('PASS')

  console.log()
  console.log(
    '===== SCENARIO 2 — QUERY PRESERVES USER LISTING CONTEXT =====',
  )

  assert(
    provider.lastQuery?.vehicle.year === 2012,
    'Vehicle year should survive the provider boundary.',
  )

  assert(
    provider.lastQuery?.vehicle.make === 'Toyota',
    'Vehicle make should survive the provider boundary.',
  )

  assert(
    provider.lastQuery?.vehicle.model === 'Camry',
    'Vehicle model should survive the provider boundary.',
  )

  assert(
    provider.lastQuery?.vehicle.trim === 'LE',
    'Vehicle trim should survive the provider boundary.',
  )

  assert(
    provider.lastQuery?.vehicle.mileage === 145000,
    'Vehicle mileage should survive the provider boundary.',
  )

  assert(
    provider.lastQuery?.locationText === 'Tampa, FL',
    'Location should survive the provider boundary.',
  )

  console.log('PASS')

  console.log()
  console.log(
    '===== VEHICLE MARKET COMPARABLE CONTRACT PASSED =====',
  )
}

await run()
