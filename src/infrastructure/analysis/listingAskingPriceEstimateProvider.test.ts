import type { Hunter } from '../../domain/hunters/Hunter'
import type { NormalizedListing } from '../../domain/discovery/NormalizedListing'
import { DealEstimationService } from '../../application/analysis/estimateDeal'
import { ListingAskingPriceEstimateProvider } from './listingAskingPriceEstimateProvider'

const hunter: Hunter = {
  id: 'hunter-asking-price-provider',
  name: 'Asking Price Provider Test',
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
  askingPrice: number | null,
): NormalizedListing => ({
  id: 'facebook_marketplace:asking-price-test',
  source: 'facebook_marketplace',
  sourceListingId: 'asking-price-test',
  sourceUrl:
    'https://example.test/asking-price-test',
  title: '2012 Toyota Camry',
  description: 'Runs and drives.',
  askingPrice,
  locationText: 'Tampa, FL',
  postedAt: '2026-08-20T12:00:00.000Z',
  discoveredAt: '2026-08-21T12:00:00.000Z',
  listingAgeDays: 1,
})

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
    '===== SCENARIO 1 — ASKING PRICE BECOMES EXPECTED PURCHASE PRICE =====',
  )

  const provider =
    new ListingAskingPriceEstimateProvider()

  const estimate = await provider.estimate({
    hunter,
    listing: createListing(2750),
  })

  assert(
    estimate?.amount === 2750,
    'Listing asking price was not preserved.',
  )

  assert(
    estimate?.origin === 'provider',
    'Asking-price estimate provenance was not provider.',
  )

  assert(
    estimate?.confidence === 'high',
    'Direct listing asking price should have high source confidence.',
  )

  console.log('PASS')

  console.log(
    '===== SCENARIO 2 — MISSING ASKING PRICE RETURNS NULL =====',
  )

  const missing = await provider.estimate({
    hunter,
    listing: createListing(null),
  })

  assert(
    missing === null,
    'Missing asking price must remain null.',
  )

  console.log('PASS')

  console.log(
    '===== SCENARIO 3 — INVALID ASKING PRICE RETURNS NULL =====',
  )

  const invalid = await provider.estimate({
    hunter,
    listing: createListing(-1),
  })

  assert(
    invalid === null,
    'Invalid negative asking price must not become an estimate.',
  )

  console.log('PASS')

  console.log(
    '===== SCENARIO 4 — PROVIDER INTEGRATES WITH ESTIMATION SERVICE =====',
  )

  const service = new DealEstimationService([
    provider,
  ])

  const result = await service.estimate({
    hunter,
    listing: createListing(3200),
  })

  assert(
    result.estimates.expectedPurchasePrice?.amount ===
      3200,
    'Estimation service did not preserve asking-price estimate.',
  )

  assert(
    result.missing.includes(
      'estimatedResaleValue',
    ),
    'Missing resale provider was incorrectly satisfied.',
  )

  assert(
    result.missing.includes(
      'estimatedRepairCost',
    ),
    'Missing repair provider was incorrectly satisfied.',
  )

  assert(
    !result.complete,
    'Single asking-price provider must not make estimation complete.',
  )

  console.log('PASS')

  console.log(
    '===== SCENARIO 5 — USER PURCHASE PRICE OVERRIDE STILL WINS =====',
  )

  const overridden = await service.estimate({
    hunter,
    listing: createListing(3200),
    overrides: {
      expectedPurchasePrice: {
        amount: 2850,
        confidence: 'high',
        origin: 'provider',
        basis: 'Buyer negotiated seller to $2,850.',
      },
    },
  })

  assert(
    overridden.estimates.expectedPurchasePrice
      ?.amount === 2850,
    'User override did not replace listing asking price.',
  )

  assert(
    overridden.estimates.expectedPurchasePrice
      ?.origin === 'user',
    'Purchase-price override provenance was not normalized to user.',
  )

  console.log('PASS')

  console.log()
  console.log(
    '===== LISTING ASKING PRICE ESTIMATE PROVIDER PASSED =====',
  )
}

await main()
