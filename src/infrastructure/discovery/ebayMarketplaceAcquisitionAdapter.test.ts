import type { MarketplaceAcquisitionRequest } from '../../domain/discovery/MarketplaceAcquisitionRequest'
import type {
  EbayBrowseClient,
  EbayBrowseSearchResult,
} from './ebayBrowseClient'
import { EbayMarketplaceAcquisitionAdapter } from './ebayMarketplaceAcquisitionAdapter'

class FakeEbayBrowseClient
  implements EbayBrowseClient
{
  requests: MarketplaceAcquisitionRequest[] =
    []

  private readonly result:
    EbayBrowseSearchResult

  constructor(
    result: EbayBrowseSearchResult,
  ) {
    this.result = result
  }

  async search(
    request: MarketplaceAcquisitionRequest,
  ): Promise<EbayBrowseSearchResult> {
    this.requests.push(request)

    return this.result
  }
}

const request: MarketplaceAcquisitionRequest = {
  source: 'ebay',
  location: {
    postalCode: '33619',
    radiusMiles: 50,
    locationText: null,
  },
  categories: ['vehicles'],
  vehicle: null,
  correlationId: 'hunter-ebay-001',
}

const context = {
  userAuthorized: false,
  userSessionAvailable: false,
}

const assert = (
  condition: boolean,
  message: string,
): void => {
  if (!condition) {
    throw new Error(message)
  }
}

console.log(
  '===== SCENARIO 1 — EBAY CAPABILITY IS OFFICIAL + AUTOMATIC =====',
)

const capabilityClient =
  new FakeEbayBrowseClient({
    itemSummaries: [],
  })

const capabilityAdapter =
  new EbayMarketplaceAcquisitionAdapter(
    capabilityClient,
  )

assert(
  capabilityAdapter.source === 'ebay',
  'Expected eBay source.',
)

assert(
  capabilityAdapter.capability
    .acquisitionMode === 'official_api',
  'Expected official API acquisition.',
)

assert(
  capabilityAdapter.capability
    .automationLevel === 'automatic',
  'Expected automatic acquisition.',
)

assert(
  capabilityAdapter.capability
    .supportsBackgroundDiscovery,
  'Expected background discovery support.',
)

assert(
  !capabilityAdapter.capability
    .requiresUserSession,
  'eBay application acquisition must not require user session.',
)

console.log('PASS')

console.log(
  '===== SCENARIO 2 — EBAY ITEM MAPS TO SEEKR RAW LISTING =====',
)

const client =
  new FakeEbayBrowseClient({
    itemSummaries: [
      {
        itemId:
          'v1|123456789|0',
        legacyItemId:
          '123456789',
        itemWebUrl:
          'https://www.ebay.com/itm/123456789',
        title:
          '2008 Mazda Mazda3 i Touring',
        price: {
          value: '3250.00',
          currency: 'USD',
        },
        condition: 'Used',
        itemLocation: {
          city: 'Tampa',
          stateOrProvince: 'FL',
          postalCode: '33619',
          country: 'US',
        },
        itemOriginDate:
          '2026-08-10T14:00:00.000Z',
        localizedAspects: [
          {
            name: 'Year',
            value: '2008',
          },
          {
            name: 'Make',
            value: 'Mazda',
          },
          {
            name: 'Model',
            value: 'Mazda3',
          },
          {
            name: 'Trim',
            value: 'i Touring',
          },
          {
            name: 'Mileage',
            value: '126,000',
          },
          {
            name: 'VIN',
            value: 'JM1BK32F081234567',
          },
        ],
      },
    ],
  })

const adapter =
  new EbayMarketplaceAcquisitionAdapter(
    client,
  )

const listings =
  await adapter.acquire(
    request,
    context,
  )

assert(
  client.requests.length === 1,
  'Expected one Browse search.',
)

assert(
  listings.length === 1,
  'Expected one mapped eBay listing.',
)

const listing = listings[0]!

assert(
  listing.source === 'ebay',
  'Expected eBay source preservation.',
)

assert(
  listing.sourceListingId ===
    'v1|123456789|0',
  'Expected RESTful item ID.',
)

assert(
  listing.askingPrice === 3250,
  'Expected numeric asking price.',
)

assert(
  listing.locationText ===
    'Tampa, FL, 33619, US',
  'Expected item location.',
)

assert(
  listing.postedAt ===
    '2026-08-10T14:00:00.000Z',
  'Expected item origin date.',
)

assert(
  listing.vehicle?.year === 2008,
  'Expected vehicle year.',
)

assert(
  listing.vehicle?.make === 'Mazda',
  'Expected vehicle make.',
)

assert(
  listing.vehicle?.model === 'Mazda3',
  'Expected vehicle model.',
)

assert(
  listing.vehicle?.mileage === 126000,
  'Expected vehicle mileage.',
)

console.log('PASS')

console.log(
  '===== SCENARIO 3 — CURRENT BID FALLS BACK WHEN FIXED PRICE ABSENT =====',
)

const auctionClient =
  new FakeEbayBrowseClient({
    itemSummaries: [
      {
        itemId: 'auction-001',
        itemWebUrl:
          'https://www.ebay.com/itm/auction-001',
        title: 'Auction Vehicle',
        currentBidPrice: {
          value: '1800',
          currency: 'USD',
        },
      },
    ],
  })

const auctionAdapter =
  new EbayMarketplaceAcquisitionAdapter(
    auctionClient,
  )

const auctionResults =
  await auctionAdapter.acquire(
    request,
    context,
  )

assert(
  auctionResults[0]
    ?.askingPrice === 1800,
  'Expected current bid fallback.',
)

console.log('PASS')

console.log(
  '===== SCENARIO 4 — MALFORMED EBAY ITEMS ARE FILTERED =====',
)

const sparseClient =
  new FakeEbayBrowseClient({
    itemSummaries: [
      {
        itemId: 'good-001',
        itemWebUrl:
          'https://www.ebay.com/itm/good-001',
        title: 'Valid Listing',
        price: {
          value: '2200',
          currency: 'USD',
        },
      },
      {
        itemId: null,
        itemWebUrl:
          'https://www.ebay.com/itm/bad',
        title: 'Missing ID',
      },
      {
        itemId: 'bad-002',
        itemWebUrl: null,
        title: 'Missing URL',
      },
    ],
  })

const sparseAdapter =
  new EbayMarketplaceAcquisitionAdapter(
    sparseClient,
  )

const sparseResults =
  await sparseAdapter.acquire(
    request,
    context,
  )

assert(
  sparseResults.length === 1,
  'Expected malformed items to be filtered.',
)

console.log('PASS')

console.log(
  '===== SCENARIO 5 — SOURCE MISMATCH IS REJECTED =====',
)

let mismatchRejected = false

try {
  await adapter.acquire(
    {
      ...request,
      source: 'craigslist',
    },
    context,
  )
} catch {
  mismatchRejected = true
}

assert(
  mismatchRejected,
  'Expected source mismatch rejection.',
)

console.log('PASS')

console.log(
  '===== EBAY MARKETPLACE ACQUISITION ADAPTER PASSED =====',
)
