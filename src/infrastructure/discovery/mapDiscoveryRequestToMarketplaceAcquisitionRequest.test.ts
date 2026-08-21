import type { DiscoveryRequest } from '../../domain/discovery/DiscoveryRequest'
import { mapDiscoveryRequestToMarketplaceAcquisitionRequest } from './mapDiscoveryRequestToMarketplaceAcquisitionRequest'

const assert = (
  condition: boolean,
  message: string,
): void => {
  if (!condition) {
    throw new Error(message)
  }
}

const request: DiscoveryRequest = {
  hunterId: 'hunter-123',
  source: 'facebook_marketplace',
  location: {
    postalCode: '33578',
    radiusMiles: 35,
  },
  categories: ['cars'],
}

const mapped =
  mapDiscoveryRequestToMarketplaceAcquisitionRequest(request)

assert(
  mapped.source === request.source,
  'source must be preserved',
)

assert(
  mapped.location.postalCode === '33578',
  'postal code must be preserved',
)

assert(
  mapped.location.radiusMiles === 35,
  'radius must be preserved',
)

assert(
  mapped.location.locationText === null,
  'Hunter discovery has no freeform location text',
)

assert(
  mapped.categories.length === 1 &&
    mapped.categories[0] === 'cars',
  'categories must be preserved',
)

assert(
  mapped.vehicle === null,
  'Hunter discovery must not invent vehicle metadata',
)

assert(
  mapped.correlationId === 'hunter-123',
  'Hunter id must survive only as correlation metadata',
)

mapped.categories.push('electronics')

assert(
  request.categories.length === 1,
  'mapped categories must not mutate the original request',
)

console.log(
  '===== DISCOVERY TO ACQUISITION REQUEST BRIDGE PASSED =====',
)
