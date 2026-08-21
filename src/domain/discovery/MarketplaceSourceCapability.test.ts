import type { MarketplaceSourceCapability } from './MarketplaceSourceCapability'

const facebookCapability: MarketplaceSourceCapability = {
  source: 'facebook_marketplace',
  acquisitionMode: 'user_mediated',
  automationLevel: 'assisted',
  requiresUserSession: true,
  requiresExplicitAuthorization: true,
  supportsBackgroundDiscovery: false,
}

const craigslistCapability: MarketplaceSourceCapability = {
  source: 'craigslist',
  acquisitionMode: 'unavailable',
  automationLevel: 'unavailable',
  requiresUserSession: false,
  requiresExplicitAuthorization: false,
  supportsBackgroundDiscovery: false,
}

if (facebookCapability.source !== 'facebook_marketplace') {
  throw new Error('Facebook capability source was not preserved')
}

if (facebookCapability.supportsBackgroundDiscovery) {
  throw new Error(
    'Facebook capability must not claim unsupported background discovery',
  )
}

if (
  facebookCapability.acquisitionMode !== 'user_mediated' ||
  facebookCapability.automationLevel !== 'assisted'
) {
  throw new Error(
    'Facebook capability must describe the current conservative acquisition boundary',
  )
}

if (
  craigslistCapability.acquisitionMode !== 'unavailable' ||
  craigslistCapability.automationLevel !== 'unavailable'
) {
  throw new Error(
    'Unknown production acquisition paths must remain unavailable until proven',
  )
}

console.log('MARKETPLACE SOURCE CAPABILITY CONTRACT PASSED')
console.log(
  JSON.stringify(
    {
      facebookCapability,
      craigslistCapability,
    },
    null,
    2,
  ),
)
