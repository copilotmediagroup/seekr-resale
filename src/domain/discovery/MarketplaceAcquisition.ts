import type { MarketplaceSource } from '../hunters/Hunter'
import type { MarketplaceAcquisitionRequest } from './MarketplaceAcquisitionRequest'
import type { RawMarketplaceListing } from './RawMarketplaceListing'

export type MarketplaceAcquisitionMode =
  | 'background'
  | 'user_mediated'
  | 'unavailable'

export type MarketplaceAutomationLevel =
  | 'automated'
  | 'assisted'
  | 'manual'
  | 'unavailable'

export interface MarketplaceAcquisitionCapability {
  source: MarketplaceSource
  acquisitionMode: MarketplaceAcquisitionMode
  automationLevel: MarketplaceAutomationLevel
  requiresUserSession: boolean
  requiresExplicitAuthorization: boolean
  supportsBackgroundDiscovery: boolean
}

export interface MarketplaceAcquisitionContext {
  userAuthorized: boolean
  userSessionAvailable: boolean
}

export interface MarketplaceAcquisitionAdapter {
  readonly source: MarketplaceSource
  readonly capability: MarketplaceAcquisitionCapability

  acquire(
    request: MarketplaceAcquisitionRequest,
    context: MarketplaceAcquisitionContext,
  ): Promise<RawMarketplaceListing[]>
}
