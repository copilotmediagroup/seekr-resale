export interface EbayServerConfig {
  clientId: string
  clientSecret: string
  marketplaceId: string
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

export const loadEbayServerConfig =
  (): EbayServerConfig => ({
    clientId:
      requiredEnvironmentValue('EBAY_CLIENT_ID'),

    clientSecret:
      requiredEnvironmentValue('EBAY_CLIENT_SECRET'),

    marketplaceId:
      process.env.EBAY_MARKETPLACE_ID?.trim() ||
      'EBAY_US',
  })
