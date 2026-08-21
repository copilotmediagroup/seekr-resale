import {
  createEstimatedDealEvaluationService,
  type EstimatedDealEvaluationComposition,
} from './createEstimatedDealEvaluationService'
import { ListingAskingPriceEstimateProvider } from '../../infrastructure/analysis/listingAskingPriceEstimateProvider'
import type { VehicleMarketComparableQuery } from '../../domain/valuation/VehicleMarketComparableProvider'
import { AcquisitionVehicleMarketComparableProvider } from '../../infrastructure/analysis/acquisitionVehicleMarketComparableProvider'
import { VehicleMarketResaleEstimateProvider } from '../../infrastructure/analysis/vehicleMarketResaleEstimateProvider'
import {
  createUserMediatedDiscovery,
  type UserMediatedDiscoveryComposition,
} from './createUserMediatedDiscovery'

export interface HunterRuntime {
  discovery: UserMediatedDiscoveryComposition
  evaluation: EstimatedDealEvaluationComposition
}

export const createHunterRuntime = (): HunterRuntime => {
  const discovery = createUserMediatedDiscovery()

  const vehicleComparableProviders =
    discovery.acquisitionAdapters.map(
      (adapter) =>
        new AcquisitionVehicleMarketComparableProvider(
          adapter,
          {
            source: adapter.source,
            acquisitionContext: {
              userAuthorized: true,
              userSessionAvailable: false,
            },
          },
        ),
    )

  const combinedComparableProvider = {
    async findComparables(query: VehicleMarketComparableQuery) {
      const results = await Promise.all(
        vehicleComparableProviders.map(
          (provider) =>
            provider.findComparables(query),
        ),
      )

      return results.flat()
    },
  }

  return {
    discovery,
    evaluation: createEstimatedDealEvaluationService([
      new ListingAskingPriceEstimateProvider(),
      new VehicleMarketResaleEstimateProvider(
        combinedComparableProvider,
      ),
    ]),
  }
}
