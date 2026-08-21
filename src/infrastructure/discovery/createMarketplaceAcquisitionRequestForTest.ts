import type { DiscoveryRequest } from '../../domain/discovery/DiscoveryRequest'
import type { MarketplaceAcquisitionRequest } from '../../domain/discovery/MarketplaceAcquisitionRequest'
import { mapDiscoveryRequestToMarketplaceAcquisitionRequest } from './mapDiscoveryRequestToMarketplaceAcquisitionRequest'

export const createMarketplaceAcquisitionRequestForTest = (
  request: DiscoveryRequest,
): MarketplaceAcquisitionRequest =>
  mapDiscoveryRequestToMarketplaceAcquisitionRequest(request)
