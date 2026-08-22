import type { Hunter } from '../../domain/hunters/Hunter'
import type { NormalizedListing } from '../../domain/discovery/NormalizedListing'
import { DealEstimationService } from './estimateDeal'
import { SeekrBuyPriceEstimateProvider } from '../../infrastructure/analysis/seekrBuyPriceEstimateProvider'

const assert = (
  condition: boolean,
  message: string,
): void => {
  if (!condition) {
    throw new Error(message)
  }
}

const hunter: Hunter = {
  id: 'hunter-buy-flow',
  name: 'Buy Flow Hunter',
  enabled: true,
  location: {
    postalCode: '33619',
    radiusMiles: 25,
  },
  categories: ['vehicles'],
  sources: ['facebook_marketplace'],
  thresholds: {
    minimumSpend: null,
    maximumSpend: 6000,
    minimumExpectedProfit: 1500,
    minimumRoiPercent: 30,
    minimumSeekrScore: null,
  },
}

const listing: NormalizedListing = {
  id: 'facebook_marketplace:buy-flow',
  source: 'facebook_marketplace',
  sourceListingId: 'buy-flow',
  sourceUrl: 'https://example.test/buy-flow',
  title: '2012 Toyota Camry',
  description: '',
  askingPrice: 5500,
  vehicle: null,
  locationText: 'Tampa, FL',
  postedAt: null,
  discoveredAt: '2026-08-22T12:00:00.000Z',
  listingAgeDays: null,
}

const monetary = (
  amount: number,
  basis: string,
) => ({
  amount,
  confidence: 'high' as const,
  origin: 'provider' as const,
  basis,
})

const service = new DealEstimationService([
  {
    field: 'estimatedResaleValue',
    async estimate() {
      return monetary(7000, 'Market value.')
    },
  },
  {
    field: 'estimatedRepairCost',
    async estimate() {
      return monetary(200, 'Repairs.')
    },
  },
  {
    field: 'estimatedTransportCost',
    async estimate() {
      return monetary(100, 'Transport.')
    },
  },
  {
    field: 'estimatedOtherCosts',
    async estimate() {
      return monetary(50, 'Other costs.')
    },
  },
  new SeekrBuyPriceEstimateProvider(),
])

console.log(
  '===== SCENARIO 1 — BUY PRICE USES KNOWN COSTS WITHOUT INVENTING TAXES/FEES =====',
)

const knownCosts = await service.estimate({
  listing,
  hunter,
})

assert(
  knownCosts.estimates.expectedPurchasePrice !== null,
  'Known costs should be sufficient to calculate SEEKR Buy Price.',
)

const knownPrice =
  knownCosts.estimates.expectedPurchasePrice!.amount

assert(
  knownPrice < listing.askingPrice!,
  'SEEKR Buy Price should remain independent of seller ask.',
)

assert(
  knownCosts.estimates.estimatedTaxesAndRegistration === null,
  'Unknown taxes must remain null.',
)

assert(
  knownCosts.estimates.estimatedTransactionFees === null,
  'Unknown transaction fees must remain null.',
)

console.log(
  `SEEKR Buy Price from known costs: ${knownPrice}`,
)
console.log('PASS')

console.log(
  '===== SCENARIO 2 — TAX/FEE USER OVERRIDES PARTICIPATE IN BUY PRICE =====',
)

const withOverrides = await service.estimate({
  listing,
  hunter,
  overrides: {
    estimatedTaxesAndRegistration: monetary(
      200,
      'User tax budget.',
    ),
    estimatedTransactionFees: monetary(
      100,
      'User fee budget.',
    ),
  },
})

const overridePrice =
  withOverrides.estimates.expectedPurchasePrice?.amount

assert(
  overridePrice !== undefined,
  'SEEKR Buy Price missing with user cost overrides.',
)

assert(
  overridePrice! < knownPrice,
  'Additional user-supplied costs should lower SEEKR Buy Price.',
)

assert(
  withOverrides.estimates.estimatedTaxesAndRegistration
    ?.origin === 'user',
  'Tax override provenance must be user.',
)

assert(
  withOverrides.estimates.estimatedTransactionFees
    ?.origin === 'user',
  'Fee override provenance must be user.',
)

console.log(
  `SEEKR Buy Price with tax/fee overrides: ${overridePrice}`,
)
console.log('PASS')

console.log(
  '===== SCENARIO 3 — USER PURCHASE PRICE OVERRIDE STILL WINS =====',
)

const negotiated = await service.estimate({
  listing,
  hunter,
  overrides: {
    expectedPurchasePrice: monetary(
      4200,
      'Negotiated purchase price.',
    ),
  },
})

assert(
  negotiated.estimates.expectedPurchasePrice?.amount ===
    4200,
  'User negotiated purchase price must override SEEKR calculation.',
)

assert(
  negotiated.estimates.expectedPurchasePrice?.origin ===
    'user',
  'Negotiated price provenance must be user.',
)

console.log('PASS')

console.log(
  '===== SEEKR BUY PRICE ESTIMATION FLOW PASSED =====',
)
