export type EbayEnvironment =
  | 'production'
  | 'sandbox'

export interface EbayServerConfig {
  clientId: string
  clientSecret: string
  marketplaceId: string
  environment: EbayEnvironment
  apiBaseUrl: string
  oauthTokenUrl: string
}

const requiredEnvironmentValue = (
  name: string,
): string => {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(
      `Missing required server environment variable: ${name}`,
    )
  }

  return value
}

const resolveEnvironment = (
  value: string | undefined,
): EbayEnvironment => {
  const normalized =
    value?.trim().toLowerCase()

  if (
    normalized === undefined ||
    normalized === '' ||
    normalized === 'production'
  ) {
    return 'production'
  }

  if (normalized === 'sandbox') {
    return 'sandbox'
  }

  throw new Error(
    'EBAY_ENVIRONMENT must be either production or sandbox.',
  )
}

const urlsForEnvironment = (
  environment: EbayEnvironment,
): {
  apiBaseUrl: string
  oauthTokenUrl: string
} => {
  if (environment === 'sandbox') {
    return {
      apiBaseUrl:
        'https://api.sandbox.ebay.com',
      oauthTokenUrl:
        'https://api.sandbox.ebay.com/identity/v1/oauth2/token',
    }
  }

  return {
    apiBaseUrl:
      'https://api.ebay.com',
    oauthTokenUrl:
      'https://api.ebay.com/identity/v1/oauth2/token',
  }
}

export const loadEbayServerConfig =
  (): EbayServerConfig => {
    const environment =
      resolveEnvironment(
        process.env.EBAY_ENVIRONMENT,
      )

    const urls =
      urlsForEnvironment(environment)

    return {
      clientId:
        requiredEnvironmentValue(
          'EBAY_CLIENT_ID',
        ),

      clientSecret:
        requiredEnvironmentValue(
          'EBAY_CLIENT_SECRET',
        ),

      marketplaceId:
        process.env.EBAY_MARKETPLACE_ID
          ?.trim() || 'EBAY_US',

      environment,

      ...urls,
    }
  }
