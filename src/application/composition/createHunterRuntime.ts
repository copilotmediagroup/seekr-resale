import {
  createEstimatedDealEvaluationService,
  type EstimatedDealEvaluationComposition,
} from './createEstimatedDealEvaluationService'
import { ListingAskingPriceEstimateProvider } from '../../infrastructure/analysis/listingAskingPriceEstimateProvider'
import type { VehicleMarketComparableQuery } from '../../domain/valuation/VehicleMarketComparableProvider'
import { AcquisitionVehicleMarketComparableProvider } from '../../infrastructure/analysis/acquisitionVehicleMarketComparableProvider'
import { VehicleMarketResaleEstimateProvider } from '../../infrastructure/analysis/vehicleMarketResaleEstimateProvider'
import { VehicleRepairEstimateProvider } from '../../infrastructure/analysis/vehicleRepairEstimateProvider'
import { TaxesAndRegistrationDealEstimateProvider } from '../../infrastructure/analysis/taxesAndRegistrationDealEstimateProvider'
import { UserControlledTaxesAndRegistrationEstimateProvider } from '../../infrastructure/analysis/userControlledTaxesAndRegistrationEstimateProvider'
import { TransactionFeeDealEstimateProvider } from '../../infrastructure/analysis/transactionFeeDealEstimateProvider'
import { UserControlledTransactionFeeEstimateProvider } from '../../infrastructure/analysis/userControlledTransactionFeeEstimateProvider'
import { OtherCostDealEstimateProvider } from '../../infrastructure/analysis/otherCostDealEstimateProvider'
import { UserControlledOtherCostEstimateProvider } from '../../infrastructure/analysis/userControlledOtherCostEstimateProvider'
import { TransportDealEstimateProvider } from '../../infrastructure/analysis/transportDealEstimateProvider'
import { UserControlledTransportEstimateProvider } from '../../infrastructure/analysis/userControlledTransportEstimateProvider'
import type { ListingEconomicsRepository } from '../../domain/listingEconomics/listingEconomicsRepository'
import { LocalStorageListingEconomicsRepository } from '../../infrastructure/listingEconomics/localStorageListingEconomicsRepository'

import {
  createUserMediatedDiscovery,
  type UserMediatedDiscoveryComposition,
} from './createUserMediatedDiscovery'
import { HunterIntelligenceService } from '../discovery/hunterIntelligenceService'
import type { HunterAcquisitionPort } from '../hunters/hunterAcquisitionPort'

export interface HunterRuntime {
  discovery: UserMediatedDiscoveryComposition
  evaluation: EstimatedDealEvaluationComposition
  listingEconomics: ListingEconomicsRepository
  intelligence: HunterIntelligenceService
  acquisition: HunterAcquisitionPort
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

  const listingEconomics =
    new LocalStorageListingEconomicsRepository()

  const evaluation = createEstimatedDealEvaluationService([
    new ListingAskingPriceEstimateProvider(),
    new VehicleMarketResaleEstimateProvider(
      combinedComparableProvider,
    ),
    new VehicleRepairEstimateProvider(),
    new TransportDealEstimateProvider(
      new UserControlledTransportEstimateProvider(),
    ),
    new TaxesAndRegistrationDealEstimateProvider(
      new UserControlledTaxesAndRegistrationEstimateProvider(),
    ),
    new TransactionFeeDealEstimateProvider(
      new UserControlledTransactionFeeEstimateProvider(),
    ),
    new OtherCostDealEstimateProvider(
      new UserControlledOtherCostEstimateProvider(),
    ),
  ])

  const intelligence = new HunterIntelligenceService(
    discovery.discoveryService,
    evaluation.evaluationService,
    listingEconomics,
  )

  const acquisition: HunterAcquisitionPort = {
    submitMarketplaceListings(hunterId, submission) {
      discovery.submissionStore.append(hunterId, {
        source: submission.source,
        listings: submission.listings.map((listing) => ({
          ...listing,
          vehicle: listing.vehicle
            ? { ...listing.vehicle }
            : null,
        })),
        submittedAt: new Date().toISOString(),
      })
    },

    clearMarketplaceListings(hunterId, source) {
      discovery.submissionStore.clear(hunterId, source)
    },

    clearHunterMarketplaceListings(hunterId) {
      discovery.submissionStore.clearHunter(hunterId)
    },
  }

  return {
    discovery,
    evaluation,
    listingEconomics,
    intelligence,
    acquisition,
  }
}
