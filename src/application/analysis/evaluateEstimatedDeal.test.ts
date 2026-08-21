import type { NormalizedListing } from '../../domain/discovery/NormalizedListing'
import type { Hunter } from '../../domain/hunters/Hunter'
import type {
  DealEstimateField,
  MonetaryEstimate,
} from '../../domain/analysis/DealEstimate'
import type {
  DealEstimateProvider,
  DealEstimationContext,
} from '../../domain/analysis/DealEstimator'
import { DealEstimationService } from './estimateDeal'
import { EstimatedDealEvaluationService } from './evaluateEstimatedDeal'

class FixedProvider implements DealEstimateProvider {
  readonly field: DealEstimateField
  private readonly amount: number

  constructor(field: DealEstimateField, amount: number) {
    this.field = field
    this.amount = amount
  }

  async estimate(
    context: DealEstimationContext,
  ): Promise<MonetaryEstimate> {
    void context

    return {
      amount: this.amount,
      confidence: 'high',
      origin: 'provider',
      basis: `Fixed test estimate for ${this.field}.`,
    }
  }
}

const listing = {
  id: 'listing-9m',
  source: 'facebook',
  sourceListingId: 'source-9m',
  sourceUrl: 'https://example.com/listing-9m',
  title: '2008 Mazda3',
  description: 'Test listing',
  askingPrice: 2500,
  vehicle: null,
  locationText: 'Tampa, FL',
  latitude: null,
  longitude: null,
  sellerName: null,
  sellerProfileUrl: null,
  imageUrls: [],
  postedAt: null,
  discoveredAt: '2026-08-21T12:00:00.000Z',
  listingAgeDays: 10,
  category: 'cars',
} as NormalizedListing

const hunter = {
  id: 'hunter-9m',
  name: 'Test Hunter',
  enabled: true,
  sources: ['facebook'],
  categories: ['cars'],
  keywords: [],
  excludedKeywords: [],
  location: {
    mode: 'anywhere',
    text: '',
    radiusMiles: null,
    postalCode: '',
  },
  thresholds: {
    minimumSpend: 1000,
    maximumSpend: 4000,
    minimumExpectedProfit: 500,
    minimumRoiPercent: 15,
    minimumSeekrScore: 40,
  },
  createdAt: '2026-08-21T12:00:00.000Z',
  updatedAt: '2026-08-21T12:00:00.000Z',
} as Hunter

const completeProviders: DealEstimateProvider[] = [
  new FixedProvider('estimatedResaleValue', 5000),
  new FixedProvider('expectedPurchasePrice', 2200),
  new FixedProvider('estimatedRepairCost', 300),
  new FixedProvider('estimatedTransportCost', 100),
  new FixedProvider('estimatedTaxesAndRegistration', 200),
  new FixedProvider('estimatedTransactionFees', 100),
  new FixedProvider('estimatedOtherCosts', 50),
]

const assert = (
  condition: boolean,
  message: string,
): void => {
  if (!condition) {
    throw new Error(message)
  }
}

const run = async (): Promise<void> => {
  console.log(
    '===== SCENARIO 1 — COMPLETE ESTIMATES FLOW INTO ANALYSIS =====',
  )

  const completeService = new EstimatedDealEvaluationService(
    new DealEstimationService(completeProviders),
  )

  const complete = await completeService.evaluate({
    listing,
    hunter,
  })

  assert(
    complete.status === 'evaluated',
    'Complete estimates should be evaluated.',
  )

  if (complete.status !== 'evaluated') {
    throw new Error('Expected evaluated result.')
  }

  assert(
    complete.evaluation.analysis.economics !== null,
    'Complete estimates must produce economics.',
  )

  assert(
    complete.evaluation.analysis.seekrScore !== null,
    'Complete estimates must produce a SEEKR score.',
  )

  console.log('PASS')

  console.log(
    '===== SCENARIO 2 — MISSING ESTIMATE BLOCKS ANALYSIS =====',
  )

  const incompleteService = new EstimatedDealEvaluationService(
    new DealEstimationService(
      completeProviders.filter(
        (provider) => provider.field !== 'estimatedRepairCost',
      ),
    ),
  )

  const incomplete = await incompleteService.evaluate({
    listing,
    hunter,
  })

  assert(
    incomplete.status === 'pending_estimates',
    'Incomplete estimates must remain pending.',
  )

  if (incomplete.status !== 'pending_estimates') {
    throw new Error('Expected pending_estimates result.')
  }

  assert(
    incomplete.estimation.missing.length === 1 &&
      incomplete.estimation.missing[0] === 'estimatedRepairCost',
    'Missing repair estimate must be reported explicitly.',
  )

  assert(
    incomplete.evaluation.analysis.economics === null,
    'Incomplete estimates must not produce economics.',
  )

  assert(
    incomplete.evaluation.analysis.seekrScore === null,
    'Incomplete estimates must not produce a SEEKR score.',
  )

  assert(
    incomplete.evaluation.qualification.status === 'pending',
    'Incomplete estimates must leave qualification pending.',
  )

  assert(
    incomplete.evaluation.qualification.failures.length === 0,
    'Missing estimates must never create false failures.',
  )

  console.log('PASS')

  console.log(
    '===== SCENARIO 3 — USER OVERRIDE COMPLETES MISSING PROVIDER =====',
  )

  const overridden = await incompleteService.evaluate({
    listing,
    hunter,
    overrides: {
      estimatedRepairCost: {
        amount: 450,
        confidence: 'high',
        origin: 'user',
        basis: 'User-entered repair estimate.',
      },
    },
  })

  assert(
    overridden.status === 'evaluated',
    'User override should complete estimation.',
  )

  if (overridden.status !== 'evaluated') {
    throw new Error('Expected evaluated override result.')
  }

  assert(
    overridden.estimation.estimates.estimatedRepairCost?.origin ===
      'user',
    'User override provenance must survive integration.',
  )

  assert(
    overridden.evaluation.analysis.economics !== null,
    'Completed override must produce economics.',
  )

  console.log('PASS')

  console.log(
    '===== ALL ESTIMATED DEAL EVALUATION SCENARIOS PASSED =====',
  )
}

void run()
