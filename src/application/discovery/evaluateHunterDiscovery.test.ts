import type {
  DealEstimateField,
  MonetaryEstimate,
} from '../../domain/analysis/DealEstimate'
import type {
  DealEstimateProvider,
  DealEstimationContext,
} from '../../domain/analysis/DealEstimator'
import type { DiscoveryRequest } from '../../domain/discovery/DiscoveryRequest'
import type { MarketplaceProvider } from '../../domain/discovery/MarketplaceProvider'
import type { RawMarketplaceListing } from '../../domain/discovery/RawMarketplaceListing'
import type { Hunter } from '../../domain/hunters/Hunter'
import { DealEstimationService } from '../analysis/estimateDeal'
import { EstimatedDealEvaluationService } from '../analysis/evaluateEstimatedDeal'
import { DeterministicMarketplaceProvider } from '../../infrastructure/discovery/deterministicMarketplaceProvider'
import { DiscoveryService } from './discoveryService'
import { evaluateHunterDiscovery } from './evaluateHunterDiscovery'
import { normalizeMarketplaceListing } from './normalizeMarketplaceListing'

class FixedEstimateProvider implements DealEstimateProvider {
  readonly field: DealEstimateField
  private readonly amount: number

  constructor(
    field: DealEstimateField,
    amount: number,
  ) {
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
      basis: `Deterministic test estimate for ${this.field}.`,
    }
  }
}

class FailingMarketplaceProvider implements MarketplaceProvider {
  readonly source = 'broken-source'

  async discover(
    request: DiscoveryRequest,
  ): Promise<RawMarketplaceListing[]> {
    throw new Error(
      `Intentional provider failure for ${request.source}`,
    )
  }
}

const hunter: Hunter = {
  id: 'hunter-intelligence-test',
  name: 'Hunter Intelligence Test',
  enabled: true,
  location: {
    postalCode: '33578',
    radiusMiles: 50,
  },
  categories: ['vehicles'],
  sources: [
    'facebook_marketplace',
    'broken-source',
  ],
  thresholds: {
    minimumSpend: 1000,
    maximumSpend: 5000,
    minimumExpectedProfit: 500,
    minimumRoiPercent: 10,
    minimumSeekrScore: 30,
  },
}

const rawListings: RawMarketplaceListing[] = [
  {
    source: 'facebook_marketplace',
    sourceListingId: 'vehicle-001',
    url: 'https://example.test/vehicle-001',
    title: '  2012 Toyota Camry  ',
    description: '  Runs and drives.  ',
    askingPrice: 2500,
      vehicle: null,
    locationText: '  Tampa, FL  ',
    postedAt: '2026-08-17T13:00:00.000Z',
    discoveredAt: '2026-08-21T13:00:00.000Z',
  },
]

const discoveryService = new DiscoveryService([
  new DeterministicMarketplaceProvider(
    'facebook_marketplace',
    rawListings,
  ),
  new FailingMarketplaceProvider(),
])

const estimationService = new DealEstimationService([
  new FixedEstimateProvider(
    'estimatedResaleValue',
    5000,
  ),
  new FixedEstimateProvider(
    'expectedPurchasePrice',
    2200,
  ),
  new FixedEstimateProvider(
    'estimatedRepairCost',
    300,
  ),
  new FixedEstimateProvider(
    'estimatedTransportCost',
    100,
  ),
  new FixedEstimateProvider(
    'estimatedTaxesAndRegistration',
    200,
  ),
  new FixedEstimateProvider(
    'estimatedTransactionFees',
    100,
  ),
  new FixedEstimateProvider(
    'estimatedOtherCosts',
    50,
  ),
])

const evaluationService =
  new EstimatedDealEvaluationService(
    estimationService,
  )

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
    '===== SCENARIO 1 — DISCOVERY FLOWS THROUGH NORMALIZATION AND ANALYSIS =====',
  )

  const result = await evaluateHunterDiscovery(
    hunter,
    discoveryService,
    evaluationService,
  )

  assert(
    result.hunterId === hunter.id,
    'Hunter identity was not preserved.',
  )

  assert(
    result.planningErrors.length === 0,
    'Valid Hunter unexpectedly produced planning errors.',
  )

  assert(
    result.discoverySuccesses.length === 1,
    'Expected one successful discovery source.',
  )

  assert(
    result.discoveryFailures.length === 1,
    'Expected one isolated discovery-source failure.',
  )

  assert(
    result.listings.length === 1,
    'Expected one normalized listing.',
  )

  assert(
    result.listings[0]?.title === '2012 Toyota Camry',
    'Raw listing title was not normalized.',
  )

  assert(
    result.listings[0]?.locationText === 'Tampa, FL',
    'Raw listing location was not normalized.',
  )

  assert(
    result.listings[0]?.listingAgeDays === 4,
    'Listing age was not calculated during normalization.',
  )

  assert(
    result.evaluations.length === 1,
    'Normalized listing was not evaluated.',
  )

  assert(
    result.evaluationFailures.length === 0,
    'Valid listing unexpectedly failed evaluation.',
  )

  const evaluation = result.evaluations[0]?.evaluation

  assert(
    evaluation?.status === 'evaluated',
    'Complete estimates did not produce evaluated intelligence.',
  )

  if (evaluation?.status !== 'evaluated') {
    throw new Error(
      'Expected evaluated intelligence result.',
    )
  }

  assert(
    evaluation.evaluation.analysis.economics !== null,
    'Discovery pipeline did not produce economics.',
  )

  assert(
    evaluation.evaluation.analysis.seekrScore !== null,
    'Discovery pipeline did not produce SEEKR Score.',
  )

  console.log('PASS')

  console.log(
    '===== SCENARIO 2 — MISSING ESTIMATES STAY PENDING =====',
  )

  const incompleteEvaluationService =
    new EstimatedDealEvaluationService(
      new DealEstimationService([
        new FixedEstimateProvider(
          'estimatedResaleValue',
          5000,
        ),
      ]),
    )

  const pendingResult = await evaluateHunterDiscovery(
    {
      ...hunter,
      sources: ['facebook_marketplace'],
    },
    discoveryService,
    incompleteEvaluationService,
  )

  assert(
    pendingResult.evaluations.length === 1,
    'Pending listing disappeared from Hunter intelligence.',
  )

  const pending =
    pendingResult.evaluations[0]?.evaluation

  assert(
    pending?.status === 'pending_estimates',
    'Incomplete estimates must remain pending.',
  )

  if (pending?.status !== 'pending_estimates') {
    throw new Error(
      'Expected pending_estimates intelligence.',
    )
  }

  assert(
    pending.evaluation.analysis.economics === null,
    'Pending discovery listing received fake economics.',
  )

  assert(
    pending.evaluation.analysis.seekrScore === null,
    'Pending discovery listing received fake SEEKR Score.',
  )

  console.log('PASS')

  console.log(
    '===== SCENARIO 3 — INVALID HUNTER STOPS BEFORE DISCOVERY =====',
  )

  const invalidResult = await evaluateHunterDiscovery(
    {
      ...hunter,
      enabled: false,
    },
    discoveryService,
    evaluationService,
  )

  assert(
    invalidResult.planningErrors.length > 0,
    'Disabled Hunter should fail discovery planning.',
  )

  assert(
    invalidResult.listings.length === 0,
    'Invalid Hunter should not produce listings.',
  )

  assert(
    invalidResult.evaluations.length === 0,
    'Invalid Hunter should not produce evaluations.',
  )

  console.log('PASS')

  console.log()
  console.log(
    '===== HUNTER DISCOVERY INTELLIGENCE PIPELINE PASSED =====',
  )
}

void run()

console.log(
  '===== N3 — LISTING-SPECIFIC ECONOMICS OVERRIDE BOUNDARY =====',
)

{
  const overrideResult = await evaluateHunterDiscovery(
    {
      ...hunter,
      sources: ['facebook_marketplace'],
    },
    discoveryService,
    new EstimatedDealEvaluationService(
      new DealEstimationService([
        new FixedEstimateProvider(
          'estimatedResaleValue',
          5000,
        ),
        new FixedEstimateProvider(
          'expectedPurchasePrice',
          2500,
        ),
        new FixedEstimateProvider(
          'estimatedRepairCost',
          400,
        ),
        new FixedEstimateProvider(
          'estimatedTransportCost',
          300,
        ),
        new FixedEstimateProvider(
          'estimatedTaxesAndRegistration',
          200,
        ),
        new FixedEstimateProvider(
          'estimatedTransactionFees',
          100,
        ),
        new FixedEstimateProvider(
          'estimatedOtherCosts',
          50,
        ),
      ]),
    ),
    {
      [normalizeMarketplaceListing(rawListings[0]).id]: {
        estimatedTransportCost: {
          amount: 0,
          confidence: 'high',
          origin: 'provider',
          basis: 'Explicit N3 transport override.',
        },
        estimatedOtherCosts: {
          amount: 125,
          confidence: 'high',
          origin: 'provider',
          basis: 'Explicit N3 other-cost override.',
        },
      },
    },
  )

  assert(
    overrideResult.evaluations.length === 1,
    'Expected one evaluated listing for N3 override test.',
  )

  const overrideEvaluation =
    overrideResult.evaluations[0]?.evaluation

  assert(
    overrideEvaluation?.status === 'evaluated',
    'Listing-specific overrides must preserve complete evaluation.',
  )

  if (overrideEvaluation?.status !== 'evaluated') {
    throw new Error(
      'Expected evaluated N3 override result.',
    )
  }

  assert(
    overrideEvaluation.estimation.estimates
      .estimatedTransportCost?.amount === 0,
    'Explicit zero listing override was not preserved.',
  )

  assert(
    overrideEvaluation.estimation.estimates
      .estimatedTransportCost?.origin === 'user',
    'Listing override must be forced to user origin.',
  )

  assert(
    overrideEvaluation.estimation.estimates
      .estimatedOtherCosts?.amount === 125,
    'Listing-specific other-cost override did not reach estimation.',
  )

  assert(
    overrideEvaluation.estimation.estimates
      .estimatedOtherCosts?.origin === 'user',
    'Listing-specific other-cost override must have user origin.',
  )

  assert(
    overrideEvaluation.estimation.estimates
      .estimatedRepairCost?.amount === 400,
    'Non-overridden field must continue using provider intelligence.',
  )

  assert(
    overrideEvaluation.estimation.estimates
      .estimatedRepairCost?.origin !== 'user',
    'Non-overridden field must not inherit user origin.',
  )

  console.log('PASS')
}

console.log(
  '===== N3 LISTING-SPECIFIC OVERRIDE BOUNDARY PASSED =====',
)
