import type { DiscoveryRequest } from '../../domain/discovery/DiscoveryRequest'
import type { MarketplaceAcquisitionRequest } from '../../domain/discovery/MarketplaceAcquisitionRequest'

export const mapDiscoveryRequestToMarketplaceAcquisitionRequest = (
  request: DiscoveryRequest,
): MarketplaceAcquisitionRequest => ({
  source: request.source,
  location: {
    postalCode: request.location.postalCode,
    radiusMiles: request.location.radiusMiles,
    locationText: null,
  },
  categories: [...request.categories],
  vehicle: null,
  correlationId: request.hunterId,
})
