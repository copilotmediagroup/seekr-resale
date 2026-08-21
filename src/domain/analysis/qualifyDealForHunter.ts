import type { DealAnalysis } from './DealAnalysis'
import type { Hunter } from '../hunters/Hunter'

export type HunterQualificationStatus =
  | 'qualified'
  | 'rejected'
  | 'pending'

export type HunterQualificationCriterion =
  | 'minimumSpend'
  | 'maximumSpend'
  | 'minimumExpectedProfit'
  | 'minimumRoiPercent'
  | 'minimumSeekrScore'

export interface HunterQualificationFailure {
  criterion: HunterQualificationCriterion
  actual: number
  required: number
}

export interface HunterQualificationPending {
  criterion: HunterQualificationCriterion
  reason: string
}

export interface HunterQualificationResult {
  hunterId: string
  listingId: string
  status: HunterQualificationStatus
  failures: HunterQualificationFailure[]
  pending: HunterQualificationPending[]
}

export const qualifyDealForHunter = (
  hunter: Hunter,
  analysis: DealAnalysis,
): HunterQualificationResult => {
  const failures: HunterQualificationFailure[] = []
  const pending: HunterQualificationPending[] = []

  const {
    minimumSpend,
    maximumSpend,
    minimumExpectedProfit,
    minimumRoiPercent,
    minimumSeekrScore,
  } = hunter.thresholds

  if (minimumSpend !== null) {
    if (analysis.economics === null) {
      pending.push({
        criterion: 'minimumSpend',
        reason: 'Deal economics are not available yet.',
      })
    } else if (analysis.economics.expectedPurchasePrice < minimumSpend) {
      failures.push({
        criterion: 'minimumSpend',
        actual: analysis.economics.expectedPurchasePrice,
        required: minimumSpend,
      })
    }
  }

  if (maximumSpend !== null) {
    if (analysis.economics === null) {
      pending.push({
        criterion: 'maximumSpend',
        reason: 'Deal economics are not available yet.',
      })
    } else if (analysis.economics.expectedPurchasePrice > maximumSpend) {
      failures.push({
        criterion: 'maximumSpend',
        actual: analysis.economics.expectedPurchasePrice,
        required: maximumSpend,
      })
    }
  }

  if (minimumExpectedProfit !== null) {
    if (analysis.economics === null) {
      pending.push({
        criterion: 'minimumExpectedProfit',
        reason: 'Deal economics are not available yet.',
      })
    } else if (
      analysis.economics.estimatedProfit < minimumExpectedProfit
    ) {
      failures.push({
        criterion: 'minimumExpectedProfit',
        actual: analysis.economics.estimatedProfit,
        required: minimumExpectedProfit,
      })
    }
  }

  if (minimumRoiPercent !== null) {
    if (analysis.economics === null) {
      pending.push({
        criterion: 'minimumRoiPercent',
        reason: 'Deal economics are not available yet.',
      })
    } else if (analysis.economics.roiPercent < minimumRoiPercent) {
      failures.push({
        criterion: 'minimumRoiPercent',
        actual: analysis.economics.roiPercent,
        required: minimumRoiPercent,
      })
    }
  }

  if (minimumSeekrScore !== null) {
    if (analysis.seekrScore === null) {
      pending.push({
        criterion: 'minimumSeekrScore',
        reason: 'SEEKR score is not available yet.',
      })
    } else if (analysis.seekrScore < minimumSeekrScore) {
      failures.push({
        criterion: 'minimumSeekrScore',
        actual: analysis.seekrScore,
        required: minimumSeekrScore,
      })
    }
  }

  const status: HunterQualificationStatus =
    failures.length > 0
      ? 'rejected'
      : pending.length > 0
        ? 'pending'
        : 'qualified'

  return {
    hunterId: hunter.id,
    listingId: analysis.listingId,
    status,
    failures,
    pending,
  }
}
