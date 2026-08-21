import { DealEstimationService } from '../analysis/estimateDeal'
import { EstimatedDealEvaluationService } from '../analysis/evaluateEstimatedDeal'
import type { DealEstimateProvider } from '../../domain/analysis/DealEstimator'

export interface EstimatedDealEvaluationComposition {
  estimationService: DealEstimationService
  evaluationService: EstimatedDealEvaluationService
}

export const createEstimatedDealEvaluationService = (
  providers: DealEstimateProvider[] = [],
): EstimatedDealEvaluationComposition => {
  const estimationService = new DealEstimationService(providers)

  const evaluationService =
    new EstimatedDealEvaluationService(estimationService)

  return {
    estimationService,
    evaluationService,
  }
}
