import assert from 'node:assert/strict'
import {
  EbayOAuthError,
  requestEbayApplicationToken,
} from './ebayOAuthClient'
import type { EbayServerConfig } from './ebayServerConfig'

const config: EbayServerConfig = {
  clientId: 'test-client-id',
  clientSecret: 'test-client-secret',
  environment: 'production',
  apiBaseUrl: 'https://api.ebay.com',
  oauthTokenUrl:
    'https://api.ebay.com/identity/v1/oauth2/token',
}

const originalFetch = globalThis.fetch

const run = async (): Promise<void> => {
  console.log(
    '===== SCENARIO 1 — REQUESTS CLIENT CREDENTIALS TOKEN =====',
  )

  let capturedUrl = ''
  let capturedInit: RequestInit | undefined

  globalThis.fetch = (async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    capturedUrl = String(input)
    capturedInit = init

    return new Response(
      JSON.stringify({
        access_token: 'application-token',
        token_type: 'Application Access Token',
        expires_in: 7200,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
  }) as typeof fetch

  const before = Date.now()

  const token =
    await requestEbayApplicationToken(config)

  const after = Date.now()

  assert.equal(
    capturedUrl,
    config.oauthTokenUrl,
  )

  assert.equal(
    capturedInit?.method,
    'POST',
  )

  const headers = new Headers(
    capturedInit?.headers,
  )

  const expectedBasic = Buffer.from(
    `${config.clientId}:${config.clientSecret}`,
    'utf8',
  ).toString('base64')

  assert.equal(
    headers.get('Authorization'),
    `Basic ${expectedBasic}`,
  )

  assert.equal(
    headers.get('Content-Type'),
    'application/x-www-form-urlencoded',
  )

  const body = new URLSearchParams(
    String(capturedInit?.body),
  )

  assert.equal(
    body.get('grant_type'),
    'client_credentials',
  )

  assert.equal(
    body.get('scope'),
    'https://api.ebay.com/oauth/api_scope',
  )

  assert.equal(
    token.accessToken,
    'application-token',
  )

  assert.equal(
    token.tokenType,
    'Application Access Token',
  )

  assert.equal(
    token.expiresIn,
    7200,
  )

  assert.ok(
    token.expiresAt >= before + 7200 * 1000,
  )

  assert.ok(
    token.expiresAt <= after + 7200 * 1000,
  )

  console.log('PASS')

  console.log()
  console.log(
    '===== SCENARIO 2 — EBAY HTTP FAILURE IS PRESERVED =====',
  )

  globalThis.fetch = (async (): Promise<Response> =>
    new Response(
      '{"error":"invalid_client"}',
      {
        status: 401,
      },
    )) as typeof fetch

  await assert.rejects(
    () =>
      requestEbayApplicationToken(config),
    (error: unknown) => {
      assert.ok(
        error instanceof EbayOAuthError,
      )

      assert.equal(error.status, 401)

      assert.match(
        error.responseBody,
        /invalid_client/,
      )

      return true
    },
  )

  console.log('PASS')

  console.log()
  console.log(
    '===== SCENARIO 3 — INVALID TOKEN PAYLOAD REJECTED =====',
  )

  globalThis.fetch = (async (): Promise<Response> =>
    new Response(
      JSON.stringify({
        token_type: 'Application Access Token',
        expires_in: 7200,
      }),
      {
        status: 200,
      },
    )) as typeof fetch

  await assert.rejects(
    () =>
      requestEbayApplicationToken(config),
    /access_token/,
  )

  console.log('PASS')

  console.log()
  console.log(
    '===== SCENARIO 4 — INVALID JSON REJECTED =====',
  )

  globalThis.fetch = (async (): Promise<Response> =>
    new Response(
      'not-json',
      {
        status: 200,
      },
    )) as typeof fetch

  await assert.rejects(
    () =>
      requestEbayApplicationToken(config),
    /valid JSON/,
  )

  console.log('PASS')

  console.log()
  console.log(
    '===== EBAY SERVER OAUTH CLIENT PASSED =====',
  )
}

run()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => {
    globalThis.fetch = originalFetch
  })
