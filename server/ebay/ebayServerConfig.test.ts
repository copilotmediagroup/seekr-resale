import assert from 'node:assert/strict'
import { loadEbayServerConfig } from './ebayServerConfig'

const originalEnvironment = {
  clientId: process.env.EBAY_CLIENT_ID,
  clientSecret:
    process.env.EBAY_CLIENT_SECRET,
  marketplaceId:
    process.env.EBAY_MARKETPLACE_ID,
  environment:
    process.env.EBAY_ENVIRONMENT,
}

const restore = (
  key: string,
  value: string | undefined,
): void => {
  if (value === undefined) {
    delete process.env[key]
  } else {
    process.env[key] = value
  }
}

const restoreEnvironment = (): void => {
  restore(
    'EBAY_CLIENT_ID',
    originalEnvironment.clientId,
  )

  restore(
    'EBAY_CLIENT_SECRET',
    originalEnvironment.clientSecret,
  )

  restore(
    'EBAY_MARKETPLACE_ID',
    originalEnvironment.marketplaceId,
  )

  restore(
    'EBAY_ENVIRONMENT',
    originalEnvironment.environment,
  )
}

try {
  console.log(
    '===== SCENARIO 1 — PRODUCTION CONFIG LOADS COMPLETE SERVER BOUNDARY =====',
  )

  process.env.EBAY_CLIENT_ID =
    'test-client-id'

  process.env.EBAY_CLIENT_SECRET =
    'test-client-secret'

  process.env.EBAY_MARKETPLACE_ID =
    'EBAY_US'

  process.env.EBAY_ENVIRONMENT =
    'production'

  assert.deepEqual(
    loadEbayServerConfig(),
    {
      clientId: 'test-client-id',
      clientSecret:
        'test-client-secret',
      marketplaceId: 'EBAY_US',
      environment: 'production',
      apiBaseUrl:
        'https://api.ebay.com',
      oauthTokenUrl:
        'https://api.ebay.com/identity/v1/oauth2/token',
    },
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 2 — SANDBOX CONFIG USES SANDBOX ENDPOINTS =====',
  )

  process.env.EBAY_ENVIRONMENT =
    'sandbox'

  const sandbox =
    loadEbayServerConfig()

  assert.equal(
    sandbox.environment,
    'sandbox',
  )

  assert.equal(
    sandbox.apiBaseUrl,
    'https://api.sandbox.ebay.com',
  )

  assert.equal(
    sandbox.oauthTokenUrl,
    'https://api.sandbox.ebay.com/identity/v1/oauth2/token',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 3 — DEFAULTS TO PRODUCTION + EBAY_US =====',
  )

  delete process.env.EBAY_ENVIRONMENT
  delete process.env.EBAY_MARKETPLACE_ID

  const defaults =
    loadEbayServerConfig()

  assert.equal(
    defaults.environment,
    'production',
  )

  assert.equal(
    defaults.marketplaceId,
    'EBAY_US',
  )

  assert.equal(
    defaults.oauthTokenUrl,
    'https://api.ebay.com/identity/v1/oauth2/token',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 4 — INVALID ENVIRONMENT IS REJECTED =====',
  )

  process.env.EBAY_ENVIRONMENT =
    'invalid'

  assert.throws(
    () => loadEbayServerConfig(),
    /production or sandbox/,
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 5 — CLIENT SECRET IS REQUIRED =====',
  )

  process.env.EBAY_ENVIRONMENT =
    'production'

  delete process.env.EBAY_CLIENT_SECRET

  assert.throws(
    () => loadEbayServerConfig(),
    /EBAY_CLIENT_SECRET/,
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== EBAY SERVER CONFIG BOUNDARY PASSED =====',
  )
} finally {
  restoreEnvironment()
}
