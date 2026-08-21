import type {
  TransactionFeeEstimateProvider,
  TransactionFeeEstimateRequest,
} from '../../domain/fees/TransactionFeeEstimateProvider'
import type {
  Hunter,
} from '../../domain/hunters/Hunter'
import type {
  NormalizedListing,
} from '../../domain/discovery/NormalizedListing'
import { DealEstimationService } from '../../application/analysis/estimateDeal'
import { TransactionFeeDealEstimateProvider } from './transactionFeeDealEstimateProvider'

const assert = (
  condition: boolean,
  message: string,
): void => {
  if (!condition) {
    throw new Error(message)
  }
}

const hunter: Hunter = {
  id: 'hunter-fee-test',
  name: 'Fee Hunter',
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
  id: 'facebook_marketplace:fee-test',
  source: 'facebook_marketplace',
  sourceListingId: 'fee-test',
  sourceUrl: 'https://example.test/fee-test',
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

class RecordingFeeProvider
  implements TransactionFeeEstimateProvider
{
  lastRequest:
    TransactionFeeEstimateRequest | null = null

  async estimateTransactionFees(
    request: TransactionFeeEstimateRequest,
  ) {
    this.lastRequest = request

    return {
      amount: 125,
      confidence: 'medium' as const,
      basis: 'External transaction fee estimate.',
    }
  }
}

const main = async (): Promise<void> => {
  console.log(
    '===== SCENARIO 1 — ADAPTER USES SOURCE AND RESOLVED PURCHASE PRICE =====',
  )

  const feeProvider =
    new RecordingFeeProvider()

  const service =
    new DealEstimationService([
      {
        field: 'expectedPurchasePrice',
        async estimate() {
          return {
            amount: 4000,
            confidence: 'high',
            origin: 'provider',
            basis: 'Expected purchase price.',
          }
        },
      },
      new TransactionFeeDealEstimateProvider(
        feeProvider,
      ),
    ])

  const result = await service.estimate({
    listing,
    hunter,
    overrides: {
      expectedPurchasePrice: {
        amount: 3600,
        confidence: 'high',
        origin: 'provider',
        basis: 'Negotiated purchase price.',
      },
    },
  })

  assert(
    feeProvider.lastRequest?.source ===
      'facebook_marketplace',
    'Marketplace source did not reach fee provider.',
  )

  assert(
    feeProvider.lastRequest?.purchasePrice ===
      3600,
    'Fee provider did not receive resolved user purchase price.',
  )

  assert(
    result.estimates
      .estimatedTransactionFees
      ?.amount === 125,
    'Transaction fee estimate was not mapped.',
  )

  assert(
    result.estimates
      .estimatedTransactionFees
      ?.origin === 'provider',
    'Transaction fee provenance was not preserved.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 2 — MISSING PURCHASE PRICE REMAINS NULL =====',
  )

  const missingService =
    new DealEstimationService([
      new TransactionFeeDealEstimateProvider(
        feeProvider,
      ),
    ])

  const missing =
    await missingService.estimate({
      listing: {
        ...listing,
        askingPrice: null,
      },
      hunter,
    })

  assert(
    missing.estimates
      .estimatedTransactionFees === null,
    'Missing purchase price must not invent transaction fees.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 3 — DECLINED FEE SOURCE REMAINS NULL =====',
  )

  const decliningProvider:
    TransactionFeeEstimateProvider = {
      async estimateTransactionFees() {
        return null
      },
    }

  const declinedService =
    new DealEstimationService([
      {
        field: 'expectedPurchasePrice',
        async estimate() {
          return {
            amount: 4000,
            confidence: 'high',
            origin: 'provider',
            basis: 'Expected purchase price.',
          }
        },
      },
      new TransactionFeeDealEstimateProvider(
        decliningProvider,
      ),
    ])

  const declined =
    await declinedService.estimate({
      listing,
      hunter,
    })

  assert(
    declined.estimates
      .estimatedTransactionFees === null,
    'Declined fee estimate must remain null.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 4 — USER TRANSACTION FEE OVERRIDE STILL WINS =====',
  )

  const overridden =
    await service.estimate({
      listing,
      hunter,
      overrides: {
        estimatedTransactionFees: {
          amount: 75,
          confidence: 'high',
          origin: 'provider',
          basis:
            'User-entered transaction fee budget.',
        },
      },
    })

  assert(
    overridden.estimates
      .estimatedTransactionFees
      ?.amount === 75,
    'User transaction fee override did not win.',
  )

  assert(
    overridden.estimates
      .estimatedTransactionFees
      ?.origin === 'user',
    'User transaction fee override provenance was not normalized.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== TRANSACTION FEE DEAL ADAPTER PASSED =====',
  )
}

await main()
