import type { NormalizedListing } from '../discovery/NormalizedListing'
import { analyzeListingDeal } from './analyzeListingDeal'

const listing: NormalizedListing = {
  id: 'facebook_marketplace:camry-001',
  source: 'facebook_marketplace',
  sourceListingId: 'camry-001',
  sourceUrl: 'https://example.test/camry-001',
  title: '2012 Toyota Camry',
  description: 'Runs and drives.',
  askingPrice: 5000,
  vehicle: null,
  locationText: 'Tampa, FL',
  postedAt: '2026-08-07T13:00:00.000Z',
  discoveredAt: '2026-08-21T13:00:00.000Z',
  listingAgeDays: 14,
}

const analysis = analyzeListingDeal({
  listing,
  valuation: {
    estimatedResaleValue: 7500,
  },
  expectedPurchasePrice: 4000,
  estimatedRepairCost: 500,
  estimatedTransportCost: 100,
  estimatedTaxesAndRegistration: 250,
  estimatedTransactionFees: 50,
  estimatedOtherCosts: 100,
})

if (analysis.status !== 'analyzed') {
  throw new Error(
    `Expected analyzed status, received ${analysis.status}`,
  )
}

if (analysis.listingId !== listing.id) {
  throw new Error('Listing identity was not preserved')
}

if (analysis.valuation?.estimatedResaleValue !== 7500) {
  throw new Error('Valuation was not preserved')
}

if (analysis.acquisitionCosts?.totalAcquisitionCost !== 5000) {
  throw new Error(
    `Expected total acquisition cost 5000, received ${analysis.acquisitionCosts?.totalAcquisitionCost}`,
  )
}

if (analysis.economics?.estimatedProfit !== 2500) {
  throw new Error(
    `Expected profit 2500, received ${analysis.economics?.estimatedProfit}`,
  )
}

if (analysis.economics?.roiPercent !== 50) {
  throw new Error(
    `Expected ROI 50, received ${analysis.economics?.roiPercent}`,
  )
}

if (analysis.seekrScore === null) {
  throw new Error('Analyzed deal did not receive a SEEKR score')
}

if (analysis.seekrScore < 0 || analysis.seekrScore > 100) {
  throw new Error(
    `SEEKR score escaped bounds: ${analysis.seekrScore}`,
  )
}

const missingPriceListing: NormalizedListing = {
  ...listing,
  id: 'facebook_marketplace:no-price',
  sourceListingId: 'no-price',
  askingPrice: null,
}

let missingPriceRejected = false

try {
  analyzeListingDeal({
    listing: missingPriceListing,
    valuation: {
      estimatedResaleValue: 7500,
    },
    expectedPurchasePrice: 4000,
    estimatedRepairCost: 0,
    estimatedTransportCost: 0,
    estimatedTaxesAndRegistration: 0,
    estimatedTransactionFees: 0,
    estimatedOtherCosts: 0,
  })
} catch {
  missingPriceRejected = true
}

if (!missingPriceRejected) {
  throw new Error(
    'Listing without asking price was incorrectly analyzed',
  )
}

console.log('DEAL ANALYSIS PIPELINE PASSED')
console.log(JSON.stringify(analysis, null, 2))
