import type { Hunter } from '../../domain/hunters/Hunter'
import { evaluateHunterDiscovery } from '../discovery/evaluateHunterDiscovery'
import { createHunterRuntime } from './createHunterRuntime'

const hunter: Hunter = {
  id: 'hunter-runtime-test',
  name: 'Hunter Runtime Test',
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

const assert = (
  condition: boolean,
  message: string,
): void => {
  if (!condition) {
    throw new Error(message)
  }
}

const main = async (): Promise<void> => {
  console.log(
    '===== SCENARIO 1 — USER SUBMISSION FLOWS THROUGH COMPLETE RUNTIME =====',
  )

  const runtime = createHunterRuntime()

  runtime.discovery.submissionStore.submit(
    hunter.id,
    {
      source: 'facebook_marketplace',
      submittedAt: '2026-08-21T12:00:00.000Z',
      listings: [
        {
          sourceListingId: 'runtime-001',
          url: 'https://example.test/runtime-001',
          title: '  2012 Toyota Camry  ',
          description: '  Runs and drives.  ',
          askingPrice: 2500,
          locationText: '  Tampa, FL  ',
          postedAt: '2026-08-20T12:00:00.000Z',
        },
      ],
    },
  )

  const result = await evaluateHunterDiscovery(
    hunter,
    runtime.discovery.discoveryService,
    runtime.evaluation.evaluationService,
  )

  assert(
    result.planningErrors.length === 0,
    'Valid runtime Hunter unexpectedly produced planning errors.',
  )

  assert(
    result.discoverySuccesses.length === 1,
    'Expected one successful runtime discovery source.',
  )

  assert(
    result.discoveryFailures.length === 0,
    'Expected zero runtime discovery failures.',
  )

  assert(
    result.listings.length === 1,
    'Expected one normalized runtime listing.',
  )

  assert(
    result.listings[0]?.title === '2012 Toyota Camry',
    'Runtime listing did not flow through normalization.',
  )

  assert(
    result.listings[0]?.locationText === 'Tampa, FL',
    'Runtime listing location did not flow through normalization.',
  )

  assert(
    result.evaluations.length === 1,
    'Expected one runtime evaluation.',
  )

  assert(
    result.evaluationFailures.length === 0,
    'Runtime listing unexpectedly failed evaluation.',
  )

  const evaluation =
    result.evaluations[0]?.evaluation

  assert(
    evaluation?.status === 'pending_estimates',
    'Production runtime without estimate providers must remain pending.',
  )

  if (evaluation?.status !== 'pending_estimates') {
    throw new Error(
      'Expected pending_estimates runtime evaluation.',
    )
  }

  assert(
    !evaluation.estimation.complete,
    'Production runtime must not claim complete estimation without providers.',
  )

  assert(
    evaluation.evaluation.analysis.economics === null,
    'Production runtime must not fabricate economics.',
  )

  assert(
    evaluation.evaluation.analysis.seekrScore === null,
    'Production runtime must not fabricate SEEKR Score.',
  )

  console.log('PASS')

  console.log()
  console.log(
    '===== COMPLETE HUNTER RUNTIME COMPOSITION PASSED =====',
  )
}

await main()
