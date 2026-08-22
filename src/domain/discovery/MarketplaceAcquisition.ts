import type { MarketplaceSource } from '../hunters/Hunter'
import type { MarketplaceAcquisitionRequest } from './MarketplaceAcquisitionRequest'
import type { RawMarketplaceListing } from './RawMarketplaceListing'

export type MarketplaceAcquisitionMode =
  | 'official_api'
  | 'authorized_feed'
  | 'authorized_browser'
  | 'user_mediated'
  | 'manual_import'
  | 'unavailable'

export type MarketplaceAutomationLevel =
  | 'automatic'
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
