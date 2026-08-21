import type { DiscoveryRequest } from './DiscoveryRequest'
import type {
  MarketplaceAcquisitionAdapter,
  MarketplaceAcquisitionContext,
} from './MarketplaceAcquisition'
import type { RawMarketplaceListing } from './RawMarketplaceListing'

class AssistedFacebookAcquisitionAdapter
  implements MarketplaceAcquisitionAdapter
{
  readonly source = 'facebook_marketplace'

  readonly capability = {
    source: 'facebook_marketplace',
    acquisitionMode: 'user_mediated',
    automationLevel: 'assisted',
    requiresUserSession: true,
    requiresExplicitAuthorization: true,
    supportsBackgroundDiscovery: false,
  } as const

  async acquire(
    request: DiscoveryRequest,
    context: MarketplaceAcquisitionContext,
  ): Promise<RawMarketplaceListing[]> {
    if (request.source !== this.source) {
      throw new Error('Acquisition source mismatch.')
    }

    if (
      this.capability.requiresExplicitAuthorization &&
      !context.userAuthorized
    ) {
      throw new Error('Explicit user authorization is required.')
    }

    if (
      this.capability.requiresUserSession &&
      !context.userSessionAvailable
    ) {
      throw new Error('An active user session is required.')
    }

    return []
  }
}

const request: DiscoveryRequest = {
  hunterId: 'hunter-acquisition-contract',
  source: 'facebook_marketplace',
  location: {
    postalCode: '33578',
    radiusMiles: 50,
  },
  categories: ['vehicles'],
}

const adapter = new AssistedFacebookAcquisitionAdapter()

if (adapter.capability.supportsBackgroundDiscovery) {
  throw new Error(
    'Facebook acquisition contract must not claim background discovery.',
  )
}

if (
  adapter.capability.acquisitionMode !== 'user_mediated' ||
  adapter.capability.automationLevel !== 'assisted'
) {
  throw new Error(
    'Facebook acquisition contract lost its conservative capability boundary.',
  )
}

let missingAuthorizationRejected = false

try {
  await adapter.acquire(request, {
    userAuthorized: false,
    userSessionAvailable: true,
  })
} catch {
  missingAuthorizationRejected = true
}

if (!missingAuthorizationRejected) {
  throw new Error(
    'Acquisition proceeded without explicit user authorization.',
  )
}

let missingSessionRejected = false

try {
  await adapter.acquire(request, {
    userAuthorized: true,
    userSessionAvailable: false,
  })
} catch {
  missingSessionRejected = true
}

if (!missingSessionRejected) {
  throw new Error(
    'Acquisition proceeded without the required user session.',
  )
}

const result = await adapter.acquire(request, {
  userAuthorized: true,
  userSessionAvailable: true,
})

if (result.length !== 0) {
  throw new Error(
    'Contract fixture unexpectedly returned marketplace data.',
  )
}

console.log('MARKETPLACE ACQUISITION CONTRACT PASSED')
