import {
  UserControlledOtherCostEstimateProvider,
} from './userControlledOtherCostEstimateProvider'

const assert = (
  condition: boolean,
  message: string,
): void => {
  if (!condition) {
    throw new Error(message)
  }
}

const main = async (): Promise<void> => {
  console.log(
    '===== SCENARIO 1 — EXACT USER OTHER-COST QUOTE IS RETURNED =====',
  )

  const provider =
    new UserControlledOtherCostEstimateProvider([
      {
        listingId: 'listing-123',
        amount: 125,
      },
    ])

  const estimate = await provider.estimateOtherCosts({
    listingId: 'listing-123',
  })

  assert(
    estimate?.amount === 125,
    'Exact user other-cost quote was not returned.',
  )

  assert(
    estimate?.confidence === 'high',
    'User-controlled other-cost quote should carry high confidence.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 2 — DIFFERENT LISTING REMAINS NULL =====',
  )

  const differentListing =
    await provider.estimateOtherCosts({
      listingId: 'listing-999',
    })

  assert(
    differentListing === null,
    'Other-cost evidence must not leak across listings.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 3 — UNKNOWN CONTEXT REMAINS NULL =====',
  )

  const unknown =
    await new UserControlledOtherCostEstimateProvider()
      .estimateOtherCosts({
        listingId: 'listing-123',
      })

  assert(
    unknown === null,
    'Unknown other costs must not be silently assigned zero.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 4 — ZERO IS A VALID EXPLICIT USER VALUE =====',
  )

  const zeroProvider =
    new UserControlledOtherCostEstimateProvider([
      {
        listingId: 'listing-zero',
        amount: 0,
      },
    ])

  const zero =
    await zeroProvider.estimateOtherCosts({
      listingId: 'listing-zero',
    })

  assert(
    zero?.amount === 0,
    'Explicit user-controlled zero other costs must be preserved.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 5 — INVALID USER VALUE IS REJECTED =====',
  )

  const invalidProvider =
    new UserControlledOtherCostEstimateProvider([
      {
        listingId: 'listing-invalid',
        amount: -25,
      },
    ])

  const invalid =
    await invalidProvider.estimateOtherCosts({
      listingId: 'listing-invalid',
    })

  assert(
    invalid === null,
    'Negative other costs must not become an estimate.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== USER-CONTROLLED OTHER COST PROVIDER PASSED =====',
  )
}

await main()
