import {
  loadEbayServerConfig,
  type EbayServerConfig,
} from './ebayServerConfig.js'

export interface EbayApplicationToken {
  accessToken: string
  tokenType: string
  expiresIn: number
  expiresAt: number
}

interface EbayOAuthTokenResponse {
  access_token?: unknown
  token_type?: unknown
  expires_in?: unknown
}

export class EbayOAuthError extends Error {
  readonly status: number
  readonly responseBody: string

  constructor(
    message: string,
    status: number,
    responseBody: string,
  ) {
    super(message)
    this.name = 'EbayOAuthError'
    this.status = status
    this.responseBody = responseBody
  }
}

const encodeCredentials = (
  clientId: string,
  clientSecret: string,
): string =>
  Buffer.from(
    `${clientId}:${clientSecret}`,
    'utf8',
  ).toString('base64')

const validateTokenResponse = (
  payload: EbayOAuthTokenResponse,
): {
  accessToken: string
  tokenType: string
  expiresIn: number
} => {
  if (
    typeof payload.access_token !== 'string' ||
    payload.access_token.length === 0
  ) {
    throw new Error(
      'eBay OAuth response did not contain a valid access_token.',
    )
  }

  if (
    typeof payload.token_type !== 'string' ||
    payload.token_type.length === 0
  ) {
    throw new Error(
      'eBay OAuth response did not contain a valid token_type.',
    )
  }

  if (
    typeof payload.expires_in !== 'number' ||
    !Number.isFinite(payload.expires_in) ||
    payload.expires_in <= 0
  ) {
    throw new Error(
      'eBay OAuth response did not contain a valid expires_in.',
    )
  }

  return {
    accessToken: payload.access_token,
    tokenType: payload.token_type,
    expiresIn: payload.expires_in,
  }
}

export const requestEbayApplicationToken = async (
  config: EbayServerConfig = loadEbayServerConfig(),
): Promise<EbayApplicationToken> => {
  const credentials = encodeCredentials(
    config.clientId,
    config.clientSecret,
  )

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    scope: 'https://api.ebay.com/oauth/api_scope',
  })

  const response = await fetch(config.oauthTokenUrl, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type':
        'application/x-www-form-urlencoded',
    },
    body,
  })

  const responseBody = await response.text()

  if (!response.ok) {
    throw new EbayOAuthError(
      `eBay OAuth token request failed with status ${response.status}.`,
      response.status,
      responseBody,
    )
  }

  let payload: EbayOAuthTokenResponse

  try {
    payload = JSON.parse(
      responseBody,
    ) as EbayOAuthTokenResponse
  } catch {
    throw new Error(
      'eBay OAuth response was not valid JSON.',
    )
  }

  const token = validateTokenResponse(payload)

  return {
    ...token,
    expiresAt:
      Date.now() + token.expiresIn * 1000,
  }
}
