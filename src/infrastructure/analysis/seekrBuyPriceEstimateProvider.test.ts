import type { Hunter } from '../../domain/hunters/Hunter'
import type { NormalizedListing } from '../../domain/discovery/NormalizedListing'
import { SeekrBuyPriceEstimateProvider } from './seekrBuyPriceEstimateProvider'

const hunter: Hunter = {
  id: 'hunter-seekr-buy-price',
  name: 'SEEKR Buy Price Provider Test',
  enabled: true,
  location: {
    postalCode: '33619',
    radiusMiles: 25,
  },
  categories: ['vehicles'],
  sources: ['facebook_marketplace'],
  thresholds: {
    minimumSpend: 1000,
    maximumSpend: 5000,
    minimumExpectedProfit: 2000,
    minimumRoiPercent: 40,
    minimumSeekrScore: null,
  },
}

const listing: NormalizedListing = {
  id: 'facebook_marketplace:seekr-buy-price-test',
  source: 'facebook_marketplace',
  sourceListingId: 'seekr-buy-price-test',
  sourceUrl: 'https://example.test/seekr-buy-price-test',
  title: '2012 Toyota Camry',
  description: 'Runs and drives.',
  askingPrice: 5000,
  vehicle: null,
  locationText: 'Tampa, FL',
  postedAt: '2026-08-20T12:00:00.000Z',
  discoveredAt: '2026-08-21T12:00:00.000Z',
  listingAgeDays: 1,
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
  const provider = new SeekrBuyPriceEstimateProvider()

  console.log(
    '===== SCENARIO 1 — SEEKR DERIVES PURCHASE PRICE FROM DEAL ECONOMICS =====',
  )

  const estimate = await provider.estimate({
    hunter,
    listing,
    resolvedEstimates: {
      estimatedResaleValue: {
        amount: 8000,
        confidence: 'high',
        origin: 'provider',
        basis: 'Market comparables.',
      },
      estimatedRepairCost: {
        amount: 500,
        confidence: 'medium',
        origin: 'provider',
        basis: 'Repair estimate.',
      },
      estimatedTransportCost: {
        amount: 100,
        confidence: 'high',
        origin: 'provider',
        basis: 'Transport estimate.',
      },
      estimatedTaxesAndRegistration: {
        amount: 200,
        confidence: 'medium',
        origin: 'provider',
        basis: 'Tax estimate.',
      },
      estimatedTransactionFees: {
        amount: 100,
        confidence: 'high',
        origin: 'provider',
        basis: 'Fee estimate.',
      },
      estimatedOtherCosts: {
        amount: 100,
        confidence: 'medium',
        origin: 'provider',
        basis: 'Other costs.',
      },
    },
  })

  assert(
    estimate !== null,
    'SEEKR Buy Price provider returned null for complete inputs.',
  )

  assert(
    estimate!.amount < listing.askingPrice!,
    'SEEKR Buy Price should be able to recommend less than seller ask.',
  )

  assert(
    estimate!.origin === 'provider',
    'SEEKR Buy Price must retain provider provenance.',
  )

  console.log(estimate)
  console.log('PASS')

  console.log(
    '===== SCENARIO 2 — SELLER ASK DOES NOT CONTROL SEEKR BUY PRICE =====',
  )

  const expensiveAsk = {
    ...listing,
    askingPrice: 7000,
  }

  const secondEstimate = await provider.estimate({
    hunter,
    listing: expensiveAsk,
    resolvedEstimates: {
      estimatedResaleValue: {
        amount: 8000,
        confidence: 'high',
        origin: 'provider',
        basis: 'Market comparables.',
      },
      estimatedRepairCost: {
        amount: 500,
        confidence: 'medium',
        origin: 'provider',
        basis: 'Repair estimate.',
      },
      estimatedTransportCost: {
        amount: 100,
        confidence: 'high',
        origin: 'provider',
        basis: 'Transport estimate.',
      },
      estimatedTaxesAndRegistration: {
        amount: 200,
        confidence: 'medium',
        origin: 'provider',
        basis: 'Tax estimate.',
      },
      estimatedTransactionFees: {
        amount: 100,
        confidence: 'high',
        origin: 'provider',
        basis: 'Fee estimate.',
      },
      estimatedOtherCosts: {
        amount: 100,
        confidence: 'medium',
        origin: 'provider',
        basis: 'Other costs.',
      },
    },
  })

  assert(
    secondEstimate?.amount === estimate!.amount,
    'Changing seller ask must not change the economics-derived SEEKR Buy Price.',
  )

  console.log('PASS')

  console.log(
    '===== SCENARIO 3 — INCOMPLETE ECONOMICS DO NOT INVENT BUY PRICE =====',
  )

  const incomplete = await provider.estimate({
    hunter,
    listing,
    resolvedEstimates: {
      estimatedResaleValue: {
        amount: 8000,
        confidence: 'high',
        origin: 'provider',
        basis: 'Market comparables.',
      },
    },
  })

  assert(
    incomplete === null,
    'Incomplete economics must not produce a SEEKR Buy Price.',
  )

  console.log('PASS')

  console.log(
    '===== ALL SEEKR BUY PRICE PROVIDER SCENARIOS PASSED =====',
  )
}

void main()
