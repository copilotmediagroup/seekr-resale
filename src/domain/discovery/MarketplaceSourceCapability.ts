import type { MarketplaceSource } from '../hunters/Hunter'

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

export interface MarketplaceSourceCapability {
  source: MarketplaceSource

  acquisitionMode: MarketplaceAcquisitionMode
  automationLevel: MarketplaceAutomationLevel

  requiresUserSession: boolean
  requiresExplicitAuthorization: boolean

  supportsBackgroundDiscovery: boolean
}
