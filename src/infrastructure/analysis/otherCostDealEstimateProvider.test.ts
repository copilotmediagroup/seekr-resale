import type {
  OtherCostEstimateProvider,
  OtherCostEstimateRequest,
} from '../../domain/costs/OtherCostEstimateProvider'
import type {
  Hunter,
} from '../../domain/hunters/Hunter'
import type {
  NormalizedListing,
} from '../../domain/discovery/NormalizedListing'
import { DealEstimationService } from '../../application/analysis/estimateDeal'
import { OtherCostDealEstimateProvider } from './otherCostDealEstimateProvider'

const assert = (
  condition: boolean,
  message: string,
): void => {
  if (!condition) {
    throw new Error(message)
  }
}

const hunter: Hunter = {
  id: 'hunter-other-cost-test',
  name: 'Other Cost Hunter',
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

const listing: NormalizedListing = {
  id: 'facebook_marketplace:other-cost-test',
  source: 'facebook_marketplace',
  sourceListingId: 'other-cost-test',
  sourceUrl: 'https://example.test/other-cost-test',
  title: '2012 Toyota Camry',
  description: '',
  askingPrice: 5000,
  vehicle: {
    year: 2012,
    make: 'Toyota',
    model: 'Camry',
    trim: null,
    mileage: 150000,
    vin: null,
    condition: 'Good',
  },
  locationText: 'Tampa, FL',
  postedAt: null,
  discoveredAt: '2026-08-21T20:00:00.000Z',
  listingAgeDays: null,
}

class RecordingOtherCostProvider
  implements OtherCostEstimateProvider
{
  lastRequest: OtherCostEstimateRequest | null = null

  async estimateOtherCosts(
    request: OtherCostEstimateRequest,
  ) {
    this.lastRequest = request

    return {
      amount: 125,
      confidence: 'high' as const,
      basis: 'User-supplied miscellaneous costs.',
    }
  }
}

const main = async (): Promise<void> => {
  console.log(
    '===== SCENARIO 1 — ADAPTER PRESERVES LISTING IDENTITY =====',
  )

  const otherCostProvider =
    new RecordingOtherCostProvider()

  const service =
    new DealEstimationService([
      new OtherCostDealEstimateProvider(
        otherCostProvider,
      ),
    ])

  const result = await service.estimate({
    listing,
    hunter,
  })

  assert(
    otherCostProvider.lastRequest?.listingId ===
      listing.id,
    'Listing identity did not reach other-cost provider.',
  )

  assert(
    result.estimates.estimatedOtherCosts?.amount ===
      125,
    'Other-cost amount was not mapped.',
  )

  assert(
    result.estimates.estimatedOtherCosts?.origin ===
      'provider',
    'Other-cost provenance was not mapped.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 2 — DECLINED SOURCE REMAINS NULL =====',
  )

  const decliningProvider:
    OtherCostEstimateProvider = {
      async estimateOtherCosts() {
        return null
      },
    }

  const declinedService =
    new DealEstimationService([
      new OtherCostDealEstimateProvider(
        decliningProvider,
      ),
    ])

  const declined =
    await declinedService.estimate({
      listing,
      hunter,
    })

  assert(
    declined.estimates.estimatedOtherCosts === null,
    'Declined other-cost source must remain null.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 3 — USER OTHER-COST OVERRIDE STILL WINS =====',
  )

  const overridden =
    await service.estimate({
      listing,
      hunter,
      overrides: {
        estimatedOtherCosts: {
          amount: 80,
          confidence: 'high',
          origin: 'provider',
          basis:
            'User-entered miscellaneous cost allowance.',
        },
      },
    })

  assert(
    overridden.estimates
      .estimatedOtherCosts
      ?.amount === 80,
    'User other-cost override did not win.',
  )

  assert(
    overridden.estimates
      .estimatedOtherCosts
      ?.origin === 'user',
    'User other-cost override provenance was not normalized.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 4 — EXPLICIT ZERO IS PRESERVED =====',
  )

  const zeroProvider:
    OtherCostEstimateProvider = {
      async estimateOtherCosts() {
        return {
          amount: 0,
          confidence: 'high',
          basis:
            'User explicitly reported no miscellaneous costs.',
        }
      },
    }

  const zeroService =
    new DealEstimationService([
      new OtherCostDealEstimateProvider(
        zeroProvider,
      ),
    ])

  const zero =
    await zeroService.estimate({
      listing,
      hunter,
    })

  assert(
    zero.estimates.estimatedOtherCosts?.amount ===
      0,
    'Explicit zero other costs were not preserved.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== OTHER COST DEAL ADAPTER PASSED =====',
  )
}

await main()
