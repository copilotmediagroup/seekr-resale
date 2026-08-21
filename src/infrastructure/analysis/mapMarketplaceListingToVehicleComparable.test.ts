import type { RawMarketplaceListing } from '../../domain/discovery/RawMarketplaceListing'
import { mapMarketplaceListingToVehicleComparable } from './mapMarketplaceListingToVehicleComparable'

const assert = (
  condition: boolean,
  message: string,
): void => {
  if (!condition) {
    throw new Error(message)
  }
}

const createListing = (
  overrides: Partial<RawMarketplaceListing> = {},
): RawMarketplaceListing => ({
  source: 'facebook_marketplace',
  sourceListingId: 'listing-123',
  url: ' https://example.com/listing-123 ',
  title: '2011 Toyota Camry LE',
  description: null,
  askingPrice: 6200,
  vehicle: {
    year: 2011,
    make: ' Toyota ',
    model: ' Camry ',
    trim: ' LE ',
    mileage: 142000,
    vin: null,
    condition: ' Good ',
  },
  locationText: ' Tampa, FL ',
  postedAt: null,
  discoveredAt: '2026-08-21T20:00:00.000Z',
  ...overrides,
})

const main = (): void => {
  console.log(
    '===== SCENARIO 1 — COMPLETE MARKETPLACE LISTING MAPS TO COMPARABLE =====',
  )

  const comparable =
    mapMarketplaceListingToVehicleComparable(
      createListing(),
    )

  assert(
    comparable !== null,
    'Expected complete vehicle listing to produce comparable.',
  )

  if (comparable === null) {
    throw new Error('Comparable unexpectedly null.')
  }

  assert(
    comparable.id ===
      'facebook_marketplace:listing-123',
    'Expected stable marketplace comparable ID.',
  )

  assert(
    comparable.source === 'facebook_marketplace',
    'Expected marketplace source to be preserved.',
  )

  assert(
    comparable.sourceUrl ===
      'https://example.com/listing-123',
    'Expected source URL to be normalized.',
  )

  assert(
    comparable.year === 2011,
    'Expected vehicle year to be preserved.',
  )

  assert(
    comparable.make === 'Toyota',
    'Expected make to be normalized.',
  )

  assert(
    comparable.model === 'Camry',
    'Expected model to be normalized.',
  )

  assert(
    comparable.trim === 'LE',
    'Expected trim to be normalized.',
  )

  assert(
    comparable.mileage === 142000,
    'Expected mileage to be preserved.',
  )

  assert(
    comparable.condition === 'Good',
    'Expected condition to be normalized.',
  )

  assert(
    comparable.locationText === 'Tampa, FL',
    'Expected location to be normalized.',
  )

  assert(
    comparable.askingPrice === 6200,
    'Expected asking price to be preserved.',
  )

  assert(
    comparable.observedAt ===
      '2026-08-21T20:00:00.000Z',
    'Expected discovery timestamp to become observation timestamp.',
  )

  console.log('PASS')

  console.log()
  console.log(
    '===== SCENARIO 2 — MISSING VEHICLE IS REJECTED =====',
  )

  assert(
    mapMarketplaceListingToVehicleComparable(
      createListing({
        vehicle: null,
      }),
    ) === null,
    'Expected missing vehicle metadata to be rejected.',
  )

  console.log('PASS')

  console.log()
  console.log(
    '===== SCENARIO 3 — MISSING VEHICLE IDENTITY IS REJECTED =====',
  )

  assert(
    mapMarketplaceListingToVehicleComparable(
      createListing({
        vehicle: {
          year: 2011,
          make: 'Toyota',
          model: null,
          trim: null,
          mileage: 142000,
          vin: null,
          condition: null,
        },
      }),
    ) === null,
    'Expected missing model to be rejected.',
  )

  console.log('PASS')

  console.log()
  console.log(
    '===== SCENARIO 4 — MISSING ASKING PRICE IS REJECTED =====',
  )

  assert(
    mapMarketplaceListingToVehicleComparable(
      createListing({
        askingPrice: null,
      }),
    ) === null,
    'Expected missing asking price to be rejected.',
  )

  console.log('PASS')

  console.log()
  console.log(
    '===== SCENARIO 5 — NONPOSITIVE ASKING PRICE IS REJECTED =====',
  )

  assert(
    mapMarketplaceListingToVehicleComparable(
      createListing({
        askingPrice: 0,
      }),
    ) === null,
    'Expected nonpositive asking price to be rejected.',
  )

  console.log('PASS')

  console.log()
  console.log(
    '===== SCENARIO 6 — BLANK MAKE OR MODEL IS REJECTED =====',
  )

  assert(
    mapMarketplaceListingToVehicleComparable(
      createListing({
        vehicle: {
          year: 2011,
          make: '   ',
          model: 'Camry',
          trim: null,
          mileage: null,
          vin: null,
          condition: null,
        },
      }),
    ) === null,
    'Expected blank make to be rejected.',
  )

  console.log('PASS')

  console.log()
  console.log(
    '===== MARKETPLACE VEHICLE COMPARABLE MAPPER PASSED =====',
  )
}

main()
