import type { Hunter } from '../../domain/hunters/Hunter'
import type { ListingEconomicsRepository } from '../../domain/listingEconomics/listingEconomicsRepository'
import type { DealEstimateOverrides } from '../analysis/estimateDeal'
import { createHunterRuntime } from '../composition/createHunterRuntime'
import { HunterIntelligenceService } from './hunterIntelligenceService'
import { normalizeMarketplaceListing } from './normalizeMarketplaceListing'

const hunter: Hunter = {
  id: 'hunter-intelligence-test',
  name: 'Hunter Intelligence Test',
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

class InMemoryListingEconomicsRepository
  implements ListingEconomicsRepository
{
  private readonly values =
    new Map<string, DealEstimateOverrides>()

  readonly requestedListingIds: string[] = []

  async getByListingId(
    listingId: string,
  ): Promise<DealEstimateOverrides> {
    this.requestedListingIds.push(listingId)

    return this.values.get(listingId) ?? {}
  }

  async save(
    listingId: string,
    overrides: DealEstimateOverrides,
  ): Promise<void> {
    this.values.set(listingId, overrides)
  }

  async delete(listingId: string): Promise<void> {
    this.values.delete(listingId)
  }
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
    '===== SCENARIO 1 — SERVICE LOADS PERSISTED ECONOMICS AUTOMATICALLY =====',
  )

  const runtime = createHunterRuntime()
  const economics =
    new InMemoryListingEconomicsRepository()

  const subjectListingId =
    normalizeMarketplaceListing({
      source: 'facebook_marketplace',
      sourceListingId: 'intelligence-001',
      url: 'https://example.test/intelligence-001',
      title: '2012 Toyota Camry',
      description: 'Runs and drives.',
      askingPrice: 2500,
      vehicle: {
        year: 2012,
        make: 'Toyota',
        model: 'Camry',
        trim: null,
        mileage: 150000,
        vin: null,
        condition: 'Runs great, no mechanical issues',
      },
      locationText: 'Tampa, FL',
      postedAt: '2026-08-20T12:00:00.000Z',
      discoveredAt: '2026-08-21T12:00:00.000Z',
    }).id

  await economics.save(subjectListingId, {
    estimatedTransportCost: {
      amount: 0,
      confidence: 'high',
      origin: 'user',
      basis: 'Persisted free transport.',
    },
    estimatedOtherCosts: {
      amount: 125,
      confidence: 'high',
      origin: 'user',
      basis: 'Persisted other costs.',
    },
  })

  runtime.discovery.submissionStore.submit(
    hunter.id,
    {
      source: 'facebook_marketplace',
      submittedAt: '2026-08-21T12:00:00.000Z',
      listings: [
        {
          sourceListingId: 'intelligence-001',
          url: 'https://example.test/intelligence-001',
          title: '2012 Toyota Camry',
          description: 'Runs and drives.',
          askingPrice: 2500,
          vehicle: {
            year: 2012,
            make: 'Toyota',
            model: 'Camry',
            trim: null,
            mileage: 150000,
            vin: null,
            condition: 'Runs great, no mechanical issues',
          },
          locationText: 'Tampa, FL',
          postedAt: '2026-08-20T12:00:00.000Z',
        },
      ],
    },
  )

  const service = new HunterIntelligenceService(
    runtime.discovery.discoveryService,
    runtime.evaluation.evaluationService,
    economics,
  )

  const result = await service.evaluateHunter(hunter)

  assert(
    result.listings.length === 1,
    'Expected one normalized listing.',
  )

  assert(
    economics.requestedListingIds.length === 1,
    'Service must load economics for every discovered listing.',
  )

  assert(
    economics.requestedListingIds[0] === subjectListingId,
    'Service loaded economics using the wrong listing identity.',
  )

  const intelligence = result.evaluations[0]

  assert(
    intelligence !== undefined,
    'Expected evaluated listing intelligence.',
  )

  assert(
    intelligence.evaluation.status === 'pending_estimates',
    'Expected remaining unknown costs to keep analysis pending.',
  )

  if (
    intelligence.evaluation.status !==
    'pending_estimates'
  ) {
    throw new Error(
      'Expected pending_estimates evaluation.',
    )
  }

  assert(
    intelligence.evaluation.estimation.estimates
      .estimatedTransportCost?.amount === 0,
    'Persisted zero transport cost did not reach evaluation.',
  )

  assert(
    intelligence.evaluation.estimation.estimates
      .estimatedTransportCost?.origin === 'user',
    'Persisted transport provenance was lost.',
  )

  assert(
    intelligence.evaluation.estimation.estimates
      .estimatedOtherCosts?.amount === 125,
    'Persisted other costs did not reach evaluation.',
  )

  console.log('PASS')

  console.log()
  console.log(
    '===== HUNTER INTELLIGENCE ORCHESTRATION PASSED =====',
  )
}

await main()
