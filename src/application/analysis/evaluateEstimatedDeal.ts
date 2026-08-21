import type { Hunter } from '../../domain/hunters/Hunter'
import type { NormalizedListing } from '../../domain/discovery/NormalizedListing'
import type {
  DealAnalysis,
  DealValuation,
} from '../../domain/analysis/DealAnalysis'
import {
  evaluateListingForHunter,
  type HunterDealEvaluation,
} from '../../domain/analysis/evaluateListingForHunter'
import type {
  HunterQualificationPending,
  HunterQualificationResult,
} from '../../domain/analysis/qualifyDealForHunter'
import type {
  DealEstimateField,
  DealEstimateSet,
} from '../../domain/analysis/DealEstimate'
import {
  DealEstimationService,
  type DealEstimateOverrides,
  type DealEstimationResult,
} from './estimateDeal'

export interface EvaluateEstimatedDealInput {
  listing: NormalizedListing
  hunter: Hunter
  overrides?: DealEstimateOverrides
}

export interface PendingEstimatedDealEvaluation {
  hunterId: string
  listingId: string
  estimation: DealEstimationResult
  analysis: DealAnalysis
  qualification: HunterQualificationResult
}

export type EstimatedDealEvaluation =
  | {
      status: 'evaluated'
      estimation: DealEstimationResult
      evaluation: HunterDealEvaluation
    }
  | {
      status: 'pending_estimates'
      estimation: DealEstimationResult
      evaluation: PendingEstimatedDealEvaluation
    }

const createPendingAnalysis = (
  listingId: string,
): DealAnalysis => ({
  listingId,
  status: 'pending_valuation',
  valuation: null,
  acquisitionCosts: null,
  economics: null,
  seekrScore: null,
})

const createPendingQualification = (
  hunter: Hunter,
  listingId: string,
  missing: DealEstimateField[],
): HunterQualificationResult => {
  const pending: HunterQualificationPending[] = []

  const reason =
    `Deal estimation is incomplete. Missing: ${missing.join(', ')}.`

  const {
    minimumSpend,
    maximumSpend,
    minimumExpectedProfit,
    minimumRoiPercent,
    minimumSeekrScore,
  } = hunter.thresholds

  if (minimumSpend !== null) {
    pending.push({
      criterion: 'minimumSpend',
      reason,
    })
  }

  if (maximumSpend !== null) {
    pending.push({
      criterion: 'maximumSpend',
      reason,
    })
  }

  if (minimumExpectedProfit !== null) {
    pending.push({
      criterion: 'minimumExpectedProfit',
      reason,
    })
  }

  if (minimumRoiPercent !== null) {
    pending.push({
      criterion: 'minimumRoiPercent',
      reason,
    })
  }

  if (minimumSeekrScore !== null) {
    pending.push({
      criterion: 'minimumSeekrScore',
      reason,
    })
  }

  return {
    hunterId: hunter.id,
    listingId,
    status: pending.length > 0 ? 'pending' : 'qualified',
    failures: [],
    pending,
  }
}

const requireEstimate = (
  estimates: DealEstimateSet,
  field: DealEstimateField,
): number => {
  const estimate = estimates[field]

  if (estimate === null) {
    throw new Error(
      `Cannot analyze incomplete deal estimate: ${field} is missing.`,
    )
  }

  return estimate.amount
}

export class EstimatedDealEvaluationService {
  private readonly estimationService: DealEstimationService

  constructor(estimationService: DealEstimationService) {
    this.estimationService = estimationService
  }

  async evaluate({
    listing,
    hunter,
    overrides,
  }: EvaluateEstimatedDealInput): Promise<EstimatedDealEvaluation> {
    const estimation = await this.estimationService.estimate({
      listing,
      hunter,
      overrides,
    })

    if (!estimation.complete) {
      const analysis = createPendingAnalysis(listing.id)
      const qualification = createPendingQualification(
        hunter,
        listing.id,
        estimation.missing,
      )

      return {
        status: 'pending_estimates',
        estimation,
        evaluation: {
          hunterId: hunter.id,
          listingId: listing.id,
          estimation,
          analysis,
          qualification,
        },
      }
    }

    const valuation: DealValuation = {
      estimatedResaleValue: requireEstimate(
        estimation.estimates,
        'estimatedResaleValue',
      ),
    }

    const evaluation = evaluateListingForHunter({
      listing,
      hunter,
      valuation,
      expectedPurchasePrice: requireEstimate(
        estimation.estimates,
        'expectedPurchasePrice',
      ),
      estimatedRepairCost: requireEstimate(
        estimation.estimates,
        'estimatedRepairCost',
      ),
      estimatedTransportCost: requireEstimate(
        estimation.estimates,
        'estimatedTransportCost',
      ),
      estimatedTaxesAndRegistration: requireEstimate(
        estimation.estimates,
        'estimatedTaxesAndRegistration',
      ),
      estimatedTransactionFees: requireEstimate(
        estimation.estimates,
        'estimatedTransactionFees',
      ),
      estimatedOtherCosts: requireEstimate(
        estimation.estimates,
        'estimatedOtherCosts',
      ),
    })

    return {
      status: 'evaluated',
      estimation,
      evaluation,
    }
  }
}
