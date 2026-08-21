import type {
  MarketplaceAcquisitionAdapter,
  MarketplaceAcquisitionContext,
} from '../../domain/discovery/MarketplaceAcquisition'
import type { MarketplaceAcquisitionRequest } from '../../domain/discovery/MarketplaceAcquisitionRequest'
import type { RawMarketplaceListing } from '../../domain/discovery/RawMarketplaceListing'
import type { MarketplaceSource } from '../../domain/hunters/Hunter'
import { AcquisitionVehicleMarketComparableProvider } from './acquisitionVehicleMarketComparableProvider'

const assert = (
  condition: boolean,
  message: string,
): void => {
  if (!condition) {
    throw new Error(message)
  }
}

class RecordingAcquisitionAdapter
  implements MarketplaceAcquisitionAdapter
{
  readonly source: MarketplaceSource
  readonly capability

  requests: MarketplaceAcquisitionRequest[] = []
  contexts: MarketplaceAcquisitionContext[] = []

  private readonly listings: RawMarketplaceListing[]

  constructor(
    source: MarketplaceSource,
    listings: RawMarketplaceListing[],
  ) {
    this.source = source
    this.listings = listings
    this.capability = {
      source,
      acquisitionMode: 'user_mediated' as const,
      automationLevel: 'assisted' as const,
      requiresUserSession: true,
      requiresExplicitAuthorization: true,
      supportsBackgroundDiscovery: false,
    }
  }

  async acquire(
    request: MarketplaceAcquisitionRequest,
    context: MarketplaceAcquisitionContext,
  ): Promise<RawMarketplaceListing[]> {
    this.requests.push(request)
    this.contexts.push(context)

    return this.listings.map((listing) => ({
      ...listing,
      vehicle:
        listing.vehicle === null
          ? null
          : { ...listing.vehicle },
    }))
  }
}

const vehicle = {
  year: 2011,
  make: 'Toyota',
  model: 'Camry',
  trim: 'LE',
  mileage: 142000,
  vin: null,
  condition: 'Good',
}

const validListing: RawMarketplaceListing = {
  source: 'facebook_marketplace',
  sourceListingId: 'fb-camry-1',
  url: 'https://example.com/fb-camry-1',
  title: '2011 Toyota Camry LE',
  description: null,
  askingPrice: 6200,
  vehicle: { ...vehicle },
  locationText: 'Tampa, FL',
  postedAt: null,
  discoveredAt: '2026-08-21T20:00:00.000Z',
}

const invalidListing: RawMarketplaceListing = {
  ...validListing,
  sourceListingId: 'fb-invalid-1',
  askingPrice: null,
}

const main = async (): Promise<void> => {
  console.log(
    '===== SCENARIO 1 — QUERY FLOWS THROUGH NEUTRAL ACQUISITION REQUEST =====',
  )

  const adapter = new RecordingAcquisitionAdapter(
    'facebook_marketplace',
    [validListing],
  )

  const provider =
    new AcquisitionVehicleMarketComparableProvider(
      adapter,
      {
        source: 'facebook_marketplace',
        acquisitionContext: {
          userAuthorized: true,
          userSessionAvailable: true,
        },
        postalCode: '33578',
        radiusMiles: 25,
      },
    )

  const comparables = await provider.findComparables({
    vehicle,
    locationText: 'Tampa, FL',
  })

  assert(
    adapter.requests.length === 1,
    'Expected one acquisition request.',
  )

  const request = adapter.requests[0]

  assert(
    request.source === 'facebook_marketplace',
    'Expected explicit marketplace source.',
  )

  assert(
    request.location.postalCode === '33578',
    'Expected configured postal code.',
  )

  assert(
    request.location.radiusMiles === 25,
    'Expected configured radius.',
  )

  assert(
    request.location.locationText === 'Tampa, FL',
    'Expected query location text.',
  )

  assert(
    request.categories.length === 1 &&
      request.categories[0] === 'cars',
    'Expected vehicle comparable acquisition to request cars.',
  )

  assert(
    request.vehicle?.make === 'Toyota' &&
      request.vehicle.model === 'Camry',
    'Expected vehicle identity to flow into acquisition request.',
  )

  assert(
    comparables.length === 1 &&
      comparables[0].id ===
        'facebook_marketplace:fb-camry-1',
    'Expected acquired listing to become comparable.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 2 — INVALID LISTINGS ARE FILTERED =====',
  )

  const filteringAdapter =
    new RecordingAcquisitionAdapter(
      'facebook_marketplace',
      [validListing, invalidListing],
    )

  const filteringProvider =
    new AcquisitionVehicleMarketComparableProvider(
      filteringAdapter,
      {
        source: 'facebook_marketplace',
        acquisitionContext: {
          userAuthorized: true,
          userSessionAvailable: true,
        },
      },
    )

  const filtered =
    await filteringProvider.findComparables({
      vehicle,
      locationText: 'Tampa, FL',
    })

  assert(
    filtered.length === 1,
    'Expected invalid marketplace listing to be filtered.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 3 — ACQUISITION CONTEXT IS PRESERVED =====',
  )

  assert(
    adapter.contexts.length === 1 &&
      adapter.contexts[0].userAuthorized === true &&
      adapter.contexts[0].userSessionAvailable === true,
    'Expected acquisition authorization context to be preserved.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 4 — SOURCE MISMATCH FAILS FAST =====',
  )

  let mismatchRejected = false

  try {
    new AcquisitionVehicleMarketComparableProvider(
      adapter,
      {
        source: 'craigslist',
        acquisitionContext: {
          userAuthorized: true,
          userSessionAvailable: true,
        },
      },
    )
  } catch {
    mismatchRejected = true
  }

  assert(
    mismatchRejected,
    'Expected adapter/provider source mismatch to be rejected.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== ACQUISITION VEHICLE MARKET COMPARABLE PROVIDER PASSED =====',
  )
}

void main()
