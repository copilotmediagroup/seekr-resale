import type { Hunter } from '../../domain/hunters/Hunter'
import type { NormalizedListing } from '../../domain/discovery/NormalizedListing'
import {
  createEstimatedDealEvaluationService,
} from './createEstimatedDealEvaluationService'

const hunter: Hunter = {
  id: 'hunter-production-composition',
  name: 'Production Composition Test',
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
    minimumExpectedProfit: 1000,
    minimumRoiPercent: 20,
    minimumSeekrScore: 70,
  },
}

const listing: NormalizedListing = {
  id: 'facebook_marketplace:composition-001',
  source: 'facebook_marketplace',
  sourceListingId: 'composition-001',
  sourceUrl: 'https://example.test/composition-001',
  title: '2012 Toyota Camry',
  description: 'Runs and drives.',
  askingPrice: 2500,
  vehicle: null,
  locationText: 'Tampa, FL',
  postedAt: '2026-08-20T12:00:00.000Z',
  discoveredAt: '2026-08-21T12:00:00.000Z',
  listingAgeDays: 1,
}

const main = async (): Promise<void> => {
  console.log(
    '===== SCENARIO 1 — PRODUCTION COMPOSITION WITHOUT FAKE PROVIDERS =====',
  )

  const {
    estimationService,
    evaluationService,
  } = createEstimatedDealEvaluationService()

  if (!estimationService) {
    throw new Error('Estimation service was not composed')
  }

  if (!evaluationService) {
    throw new Error('Evaluation service was not composed')
  }

  const result = await evaluationService.evaluate({
    hunter,
    listing,
  })

  if (result.status !== 'pending_estimates') {
    throw new Error(
      `Expected pending_estimates, received ${result.status}`,
    )
  }

  if (result.estimation.complete) {
    throw new Error(
      'Empty production provider set must not claim complete estimation',
    )
  }

  if (result.estimation.missing.length !== 7) {
    throw new Error(
      `Expected 7 missing estimates, received ${result.estimation.missing.length}`,
    )
  }

  if (result.evaluation.analysis.economics !== null) {
    throw new Error(
      'Incomplete production estimates must not fabricate economics',
    )
  }

  if (result.evaluation.analysis.seekrScore !== null) {
    throw new Error(
      'Incomplete production estimates must not fabricate SEEKR score',
    )
  }

  console.log('PASS')

  console.log()
  console.log(
    '===== PRODUCTION EVALUATION COMPOSITION PASSED =====',
  )
}

await main()
