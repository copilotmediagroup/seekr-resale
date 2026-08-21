import type { RawMarketplaceListing } from '../../domain/discovery/RawMarketplaceListing'
import { normalizeMarketplaceListing } from './normalizeMarketplaceListing'

const raw: RawMarketplaceListing = {
  source: 'facebook_marketplace',
  sourceListingId: 'listing-123',
  url: '  https://example.test/listing-123  ',
  title: '  2012 Toyota Camry  ',
  description: '  Runs and drives.  ',
  askingPrice: 2400,
  locationText: '  Tampa, FL  ',
  postedAt: '2026-08-17T13:00:00.000Z',
  discoveredAt: '2026-08-21T13:00:00.000Z',
}

const normalized = normalizeMarketplaceListing(raw)

if (normalized.id !== 'facebook_marketplace:listing-123') {
  throw new Error(`Unexpected normalized id: ${normalized.id}`)
}

if (normalized.source !== raw.source) {
  throw new Error('Source was not preserved')
}

if (normalized.sourceListingId !== raw.sourceListingId) {
  throw new Error('Source listing id was not preserved')
}

if (normalized.sourceUrl !== 'https://example.test/listing-123') {
  throw new Error('Source URL was not normalized')
}

if (normalized.title !== '2012 Toyota Camry') {
  throw new Error('Title was not normalized')
}

if (normalized.description !== 'Runs and drives.') {
  throw new Error('Description was not normalized')
}

if (normalized.locationText !== 'Tampa, FL') {
  throw new Error('Location was not normalized')
}

if (normalized.askingPrice !== 2400) {
  throw new Error('Asking price was not preserved')
}

if (normalized.postedAt !== raw.postedAt) {
  throw new Error('Posted timestamp was not preserved')
}

if (normalized.discoveredAt !== raw.discoveredAt) {
  throw new Error('Discovery timestamp was not preserved')
}

if (normalized.listingAgeDays !== 4) {
  throw new Error(
    `Expected listing age 4, received ${normalized.listingAgeDays}`,
  )
}

const sparse = normalizeMarketplaceListing({
  ...raw,
  source: 'craigslist',
  sourceListingId: 'listing-456',
  description: '   ',
  askingPrice: null,
  locationText: '   ',
  postedAt: null,
})

if (sparse.id !== 'craigslist:listing-456') {
  throw new Error('Sparse listing identity failed')
}

if (sparse.description !== null) {
  throw new Error('Blank description should normalize to null')
}

if (sparse.locationText !== null) {
  throw new Error('Blank location should normalize to null')
}

if (sparse.askingPrice !== null) {
  throw new Error('Unknown asking price should remain null')
}

if (sparse.listingAgeDays !== null) {
  throw new Error('Unknown posted date should produce null age')
}

const futurePosted = normalizeMarketplaceListing({
  ...raw,
  sourceListingId: 'listing-future',
  postedAt: '2026-08-22T13:00:00.000Z',
})

if (futurePosted.listingAgeDays !== null) {
  throw new Error('Future posted date should produce null age')
}

console.log('NORMALIZED LISTING CONTRACT PASSED')
console.log(JSON.stringify(normalized, null, 2))
