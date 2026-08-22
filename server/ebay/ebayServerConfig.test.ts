import assert from 'node:assert/strict'
import { loadEbayServerConfig } from './ebayServerConfig'

const originalEnvironment = {
  clientId: process.env.EBAY_CLIENT_ID,
  clientSecret: process.env.EBAY_CLIENT_SECRET,
  marketplaceId: process.env.EBAY_MARKETPLACE_ID,
}

const restoreEnvironment = () => {
  const restore = (
    key: string,
    value: string | undefined,
  ) => {
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }

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
}

try {
  console.log(
    '===== SCENARIO 1 — SERVER CONFIG LOADS SECRET CREDENTIALS =====',
  )

  process.env.EBAY_CLIENT_ID = 'test-client-id'
  process.env.EBAY_CLIENT_SECRET = 'test-client-secret'
  process.env.EBAY_MARKETPLACE_ID = 'EBAY_US'

  assert.deepEqual(
    loadEbayServerConfig(),
    {
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      marketplaceId: 'EBAY_US',
    },
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 2 — MARKETPLACE DEFAULTS TO EBAY_US =====',
  )

  delete process.env.EBAY_MARKETPLACE_ID

  assert.equal(
    loadEbayServerConfig().marketplaceId,
    'EBAY_US',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 3 — CLIENT SECRET IS REQUIRED =====',
  )

  delete process.env.EBAY_CLIENT_SECRET

  assert.throws(
    () => loadEbayServerConfig(),
    /EBAY_CLIENT_SECRET/,
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 4 — CLIENT ID IS REQUIRED =====',
  )

  process.env.EBAY_CLIENT_SECRET =
    'test-client-secret'

  delete process.env.EBAY_CLIENT_ID

  assert.throws(
    () => loadEbayServerConfig(),
    /EBAY_CLIENT_ID/,
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== EBAY SERVER CONFIG BOUNDARY PASSED =====',
  )
} finally {
  restoreEnvironment()
}
