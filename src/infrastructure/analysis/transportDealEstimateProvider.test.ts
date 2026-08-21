import type {
  TransportEstimateProvider,
  TransportEstimateRequest,
} from '../../domain/transport/TransportEstimateProvider'
import type {
  Hunter,
} from '../../domain/hunters/Hunter'
import type {
  NormalizedListing,
} from '../../domain/discovery/NormalizedListing'
import { DealEstimationService } from '../../application/analysis/estimateDeal'
import { TransportDealEstimateProvider } from './transportDealEstimateProvider'

const assert = (
  condition: boolean,
  message: string,
): void => {
  if (!condition) {
    throw new Error(message)
  }
}

const hunter: Hunter = {
  id: 'hunter-transport-test',
  name: 'Transport Hunter',
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

const listing = (
  locationText: string | null,
): NormalizedListing => ({
  id: 'facebook_marketplace:transport-test',
  source: 'facebook_marketplace',
  sourceListingId: 'transport-test',
  sourceUrl: 'https://example.test/transport-test',
  title: '2012 Toyota Camry',
  description: '',
  askingPrice: 2500,
  vehicle: {
    year: 2012,
    make: 'Toyota',
    model: 'Camry',
    trim: null,
    mileage: 150000,
    vin: null,
    condition: 'Good',
  },
  locationText,
  postedAt: null,
  discoveredAt: '2026-08-21T20:00:00.000Z',
  listingAgeDays: null,
})

class RecordingTransportProvider
  implements TransportEstimateProvider
{
  lastRequest: TransportEstimateRequest | null = null

  async estimateTransport(
    request: TransportEstimateRequest,
  ) {
    this.lastRequest = request

    return {
      amount: 185,
      confidence: 'medium' as const,
      basis: 'External transport quote.',
    }
  }
}

const main = async (): Promise<void> => {
  console.log(
    '===== SCENARIO 1 — DEAL ADAPTER MAPS CONTEXT TO TRANSPORT PORT =====',
  )

  const transportProvider =
    new RecordingTransportProvider()

  const provider =
    new TransportDealEstimateProvider(
      transportProvider,
    )

  const estimate = await provider.estimate({
    hunter,
    listing: listing(' Tampa, FL '),
  })

  assert(
    transportProvider.lastRequest
      ?.originPostalCode === '33619',
    'Hunter postal code did not reach transport provider.',
  )

  assert(
    transportProvider.lastRequest
      ?.destinationLocationText === 'Tampa, FL',
    'Listing destination did not reach transport provider.',
  )

  assert(
    estimate?.amount === 185,
    'Transport amount was not mapped.',
  )

  assert(
    estimate?.origin === 'provider',
    'Transport provider provenance was not preserved.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 2 — MISSING LISTING LOCATION REMAINS NULL =====',
  )

  const missingLocation =
    await provider.estimate({
      hunter,
      listing: listing(null),
    })

  assert(
    missingLocation === null,
    'Missing destination must not invent transport cost.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 3 — DECLINED TRANSPORT SOURCE REMAINS NULL =====',
  )

  const decliningProvider:
    TransportEstimateProvider = {
      async estimateTransport() {
        return null
      },
    }

  const declined =
    await new TransportDealEstimateProvider(
      decliningProvider,
    ).estimate({
      hunter,
      listing: listing('Tampa, FL'),
    })

  assert(
    declined === null,
    'Declined transport estimate must remain null.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 4 — USER OVERRIDE STILL WINS =====',
  )

  const service =
    new DealEstimationService([
      new TransportDealEstimateProvider(
        transportProvider,
      ),
    ])

  const result = await service.estimate({
    hunter,
    listing: listing('Tampa, FL'),
    overrides: {
      estimatedTransportCost: {
        amount: 75,
        confidence: 'high',
        origin: 'provider',
        basis: 'User-entered pickup budget.',
      },
    },
  })

  assert(
    result.estimates.estimatedTransportCost
      ?.amount === 75,
    'User transport override did not win.',
  )

  assert(
    result.estimates.estimatedTransportCost
      ?.origin === 'user',
    'User transport override provenance was not normalized.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== TRANSPORT DEAL ESTIMATE ADAPTER PASSED =====',
  )
}

await main()
