import type { Hunter } from '../../domain/hunters/Hunter'
import { createHunterRuntime } from './createHunterRuntime'

const assert = (
  condition: boolean,
  message: string,
): void => {
  if (!condition) {
    throw new Error(message)
  }
}

const hunter: Hunter = {
  id: 'hunter-acquisition-runtime',
  name: 'Acquisition Runtime Hunter',
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

const main = async (): Promise<void> => {
  console.log(
    '===== SCENARIO 1 — APPLICATION PORT SUBMISSION REACHES PRODUCTION DISCOVERY =====',
  )

  const runtime = createHunterRuntime()

  runtime.acquisition.submitMarketplaceListings(
    hunter.id,
    {
      source: 'facebook_marketplace',
      listings: [
        {
          sourceListingId: 'fb-runtime-001',
          url: 'https://example.test/fb-runtime-001',
          title: '2008 Mazda3',
          description: 'Runs and drives.',
          askingPrice: 2900,
          locationText: 'Tampa, FL',
          postedAt: '2026-08-20T12:00:00.000Z',
          vehicle: {
            year: 2008,
            make: 'Mazda',
            model: 'Mazda3',
            trim: null,
            mileage: 126000,
            vin: null,
            condition: null,
          },
        },
      ],
    },
  )

  const discovered =
    await runtime.discovery.discoveryService.discover({
      hunterId: hunter.id,
      source: 'facebook_marketplace',
      location: hunter.location,
      categories: hunter.categories,
    })

  assert(
    discovered.length === 1,
    `Expected 1 submitted listing, received ${discovered.length}`,
  )

  assert(
    discovered[0]?.sourceListingId === 'fb-runtime-001',
    'Submitted listing did not reach production discovery.',
  )

  assert(
    discovered[0]?.askingPrice === 2900,
    'Submitted asking price was not preserved.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 2 — SOURCE CLEAR REMOVES ONLY TARGET SUBMISSION =====',
  )

  runtime.acquisition.submitMarketplaceListings(
    hunter.id,
    {
      source: 'craigslist',
      listings: [
        {
          sourceListingId: 'cl-runtime-001',
          url: 'https://example.test/cl-runtime-001',
          title: '2011 Honda Accord',
          askingPrice: 3500,
        },
      ],
    },
  )

  runtime.acquisition.clearMarketplaceListings(
    hunter.id,
    'facebook_marketplace',
  )

  const clearedFacebook =
    await runtime.discovery.discoveryService.discover({
      hunterId: hunter.id,
      source: 'facebook_marketplace',
      location: hunter.location,
      categories: hunter.categories,
    })

  const preservedCraigslist =
    await runtime.discovery.discoveryService.discover({
      hunterId: hunter.id,
      source: 'craigslist',
      location: hunter.location,
      categories: hunter.categories,
    })

  assert(
    clearedFacebook.length === 0,
    'Facebook submission was not cleared.',
  )

  assert(
    preservedCraigslist.length === 1,
    'Clearing Facebook incorrectly removed Craigslist.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 3 — CLEAR HUNTER REMOVES ALL MARKETPLACE SUBMISSIONS =====',
  )

  runtime.acquisition.submitMarketplaceListings(
    hunter.id,
    {
      source: 'facebook_marketplace',
      listings: [
        {
          sourceListingId: 'fb-runtime-002',
          url: 'https://example.test/fb-runtime-002',
          title: '2004 Toyota Camry',
          askingPrice: 3200,
        },
      ],
    },
  )

  runtime.acquisition.clearHunterMarketplaceListings(
    hunter.id,
  )

  const finalFacebook =
    await runtime.discovery.discoveryService.discover({
      hunterId: hunter.id,
      source: 'facebook_marketplace',
      location: hunter.location,
      categories: hunter.categories,
    })

  const finalCraigslist =
    await runtime.discovery.discoveryService.discover({
      hunterId: hunter.id,
      source: 'craigslist',
      location: hunter.location,
      categories: hunter.categories,
    })

  assert(
    finalFacebook.length === 0 &&
      finalCraigslist.length === 0,
    'Hunter-wide clear did not remove all submissions.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 4 — REPEATED APPLICATION SUBMISSIONS APPEND =====',
  )

  runtime.acquisition.submitMarketplaceListings(
    hunter.id,
    {
      source: 'facebook_marketplace',
      listings: [
        {
          sourceListingId: 'fb-append-001',
          url: 'https://example.test/fb-append-001',
          title: '2008 Mazda3',
          askingPrice: 2900,
        },
      ],
    },
  )

  runtime.acquisition.submitMarketplaceListings(
    hunter.id,
    {
      source: 'facebook_marketplace',
      listings: [
        {
          sourceListingId: 'fb-append-002',
          url: 'https://example.test/fb-append-002',
          title: '2004 Toyota Camry',
          askingPrice: 3200,
        },
      ],
    },
  )

  const appendedFacebook =
    await runtime.discovery.discoveryService.discover({
      hunterId: hunter.id,
      source: 'facebook_marketplace',
      location: hunter.location,
      categories: hunter.categories,
    })

  assert(
    appendedFacebook.length === 2,
    `Expected 2 appended Facebook listings, received ${appendedFacebook.length}`,
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== HUNTER ACQUISITION APPLICATION PORT PASSED =====',
  )
}

void main()
