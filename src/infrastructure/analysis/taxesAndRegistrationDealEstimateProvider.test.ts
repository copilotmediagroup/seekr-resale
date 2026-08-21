import type {
  TaxesAndRegistrationEstimateProvider,
  TaxesAndRegistrationEstimateRequest,
} from '../../domain/taxes/TaxesAndRegistrationEstimateProvider'
import type {
  Hunter,
} from '../../domain/hunters/Hunter'
import type {
  NormalizedListing,
} from '../../domain/discovery/NormalizedListing'
import { DealEstimationService } from '../../application/analysis/estimateDeal'
import { TaxesAndRegistrationDealEstimateProvider } from './taxesAndRegistrationDealEstimateProvider'

const assert = (
  condition: boolean,
  message: string,
): void => {
  if (!condition) {
    throw new Error(message)
  }
}

const hunter: Hunter = {
  id: 'hunter-tax-test',
  name: 'Tax Hunter',
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
  id: 'facebook_marketplace:tax-test',
  source: 'facebook_marketplace',
  sourceListingId: 'tax-test',
  sourceUrl: 'https://example.test/tax-test',
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

class RecordingTaxesProvider
  implements TaxesAndRegistrationEstimateProvider
{
  lastRequest:
    TaxesAndRegistrationEstimateRequest | null = null

  async estimateTaxesAndRegistration(
    request: TaxesAndRegistrationEstimateRequest,
  ) {
    this.lastRequest = request

    return {
      amount: 240,
      confidence: 'medium' as const,
      basis:
        'External taxes and registration estimate.',
    }
  }
}

const main = async (): Promise<void> => {
  console.log(
    '===== SCENARIO 1 — ADAPTER USES RESOLVED PURCHASE PRICE =====',
  )

  const taxesProvider =
    new RecordingTaxesProvider()

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
      new TaxesAndRegistrationDealEstimateProvider(
        taxesProvider,
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
        basis:
          'User negotiated purchase price.',
      },
    },
  })

  assert(
    taxesProvider.lastRequest?.purchasePrice ===
      3600,
    'Taxes provider did not receive resolved user purchase price.',
  )

  assert(
    taxesProvider.lastRequest?.buyerPostalCode ===
      '33619',
    'Buyer postal code did not reach taxes provider.',
  )

  assert(
    taxesProvider.lastRequest
      ?.listingLocationText === 'Tampa, FL',
    'Listing location did not reach taxes provider.',
  )

  assert(
    result.estimates
      .estimatedTaxesAndRegistration
      ?.amount === 240,
    'Taxes estimate amount was not mapped.',
  )

  assert(
    result.estimates
      .estimatedTaxesAndRegistration
      ?.origin === 'provider',
    'Taxes provenance was not preserved.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 2 — MISSING RESOLVED PURCHASE PRICE RETURNS NULL =====',
  )

  const noPurchaseService =
    new DealEstimationService([
      new TaxesAndRegistrationDealEstimateProvider(
        taxesProvider,
      ),
    ])

  const missing =
    await noPurchaseService.estimate({
      listing: {
        ...listing,
        askingPrice: null,
      },
      hunter,
    })

  assert(
    missing.estimates
      .estimatedTaxesAndRegistration === null,
    'Missing purchase price must not invent taxes.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 3 — DECLINED TAX SOURCE REMAINS NULL =====',
  )

  const decliningProvider:
    TaxesAndRegistrationEstimateProvider = {
      async estimateTaxesAndRegistration() {
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
      new TaxesAndRegistrationDealEstimateProvider(
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
      .estimatedTaxesAndRegistration === null,
    'Declined tax estimate must remain null.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 4 — USER TAX OVERRIDE STILL WINS =====',
  )

  const overridden =
    await service.estimate({
      listing,
      hunter,
      overrides: {
        estimatedTaxesAndRegistration: {
          amount: 150,
          confidence: 'high',
          origin: 'provider',
          basis:
            'User-entered tax and registration budget.',
        },
      },
    })

  assert(
    overridden.estimates
      .estimatedTaxesAndRegistration
      ?.amount === 150,
    'User taxes override did not win.',
  )

  assert(
    overridden.estimates
      .estimatedTaxesAndRegistration
      ?.origin === 'user',
    'User tax override provenance was not normalized.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== TAXES & REGISTRATION DEAL ADAPTER PASSED =====',
  )
}

await main()
