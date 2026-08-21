import type { MarketplaceSource } from '../../domain/hunters/Hunter'
import type { MarketplaceAcquisitionAdapter } from '../../domain/discovery/MarketplaceAcquisition'
import { AcquisitionMarketplaceProvider } from '../../infrastructure/discovery/acquisitionMarketplaceProvider'
import { InMemoryUserMediatedSubmissionStore } from '../../infrastructure/discovery/inMemoryUserMediatedSubmissionStore'
import { UserMediatedMarketplaceAdapter } from '../../infrastructure/discovery/userMediatedMarketplaceAdapter'
import { createDiscoveryService } from './createDiscoveryService'

export interface UserMediatedDiscoveryComposition {
  discoveryService: ReturnType<typeof createDiscoveryService>
  submissionStore: InMemoryUserMediatedSubmissionStore
  acquisitionAdapters: MarketplaceAcquisitionAdapter[]
}

const USER_MEDIATED_SOURCES: MarketplaceSource[] = [
  'facebook_marketplace',
  'craigslist',
]

export const createUserMediatedDiscovery =
  (): UserMediatedDiscoveryComposition => {
    const submissionStore =
      new InMemoryUserMediatedSubmissionStore()

    const resolver =
      submissionStore.createResolver()

    const acquisitionAdapters =
      USER_MEDIATED_SOURCES.map(
        (source): MarketplaceAcquisitionAdapter =>
          new UserMediatedMarketplaceAdapter(
            source,
            resolver,
          ),
      )

    const providers =
      acquisitionAdapters.map(
        (adapter) =>
          new AcquisitionMarketplaceProvider(
            adapter,
            () => ({
              userAuthorized: true,
              userSessionAvailable: false,
            }),
          ),
      )

    return {
      discoveryService: createDiscoveryService({
        providers,
      }),
      submissionStore,
      acquisitionAdapters: [...acquisitionAdapters],
    }
  }
