import { DiscoveryService } from '../discovery/discoveryService'
import type { MarketplaceProvider } from '../../domain/discovery/MarketplaceProvider'

export interface DiscoveryComposition {
  providers: MarketplaceProvider[]
}

export const createDiscoveryService = (
  composition: DiscoveryComposition,
): DiscoveryService => {
  return new DiscoveryService([...composition.providers])
}
