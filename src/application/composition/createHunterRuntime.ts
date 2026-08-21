import {
  createEstimatedDealEvaluationService,
  type EstimatedDealEvaluationComposition,
} from './createEstimatedDealEvaluationService'
import { ListingAskingPriceEstimateProvider } from '../../infrastructure/analysis/listingAskingPriceEstimateProvider'
import {
  createUserMediatedDiscovery,
  type UserMediatedDiscoveryComposition,
} from './createUserMediatedDiscovery'

export interface HunterRuntime {
  discovery: UserMediatedDiscoveryComposition
  evaluation: EstimatedDealEvaluationComposition
}

export const createHunterRuntime = (): HunterRuntime => ({
  discovery: createUserMediatedDiscovery(),
  evaluation: createEstimatedDealEvaluationService([
    new ListingAskingPriceEstimateProvider(),
  ]),
})
