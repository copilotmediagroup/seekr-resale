import {
  UserControlledTransactionFeeEstimateProvider,
} from './userControlledTransactionFeeEstimateProvider'

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
    '===== SCENARIO 1 — EXACT USER FEE QUOTE IS RETURNED =====',
  )

  const provider =
    new UserControlledTransactionFeeEstimateProvider([
      {
        source: 'facebook_marketplace',
        purchasePrice: 3600,
        amount: 75,
      },
    ])

  const estimate =
    await provider.estimateTransactionFees({
      source: 'facebook_marketplace',
      purchasePrice: 3600,
    })

  assert(
    estimate?.amount === 75,
    'Exact user transaction fee quote was not returned.',
  )

  assert(
    estimate?.confidence === 'high',
    'User-controlled fee quote should carry high confidence.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 2 — DIFFERENT PURCHASE PRICE REMAINS NULL =====',
  )

  const differentPurchase =
    await provider.estimateTransactionFees({
      source: 'facebook_marketplace',
      purchasePrice: 4000,
    })

  assert(
    differentPurchase === null,
    'Different purchase price must not reuse stale fee evidence.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 3 — DIFFERENT MARKETPLACE REMAINS NULL =====',
  )

  const differentSource =
    await provider.estimateTransactionFees({
      source: 'craigslist',
      purchasePrice: 3600,
    })

  assert(
    differentSource === null,
    'Different marketplace must not reuse fee evidence.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 4 — UNKNOWN CONTEXT REMAINS NULL =====',
  )

  const unknown =
    await new UserControlledTransactionFeeEstimateProvider()
      .estimateTransactionFees({
        source: 'facebook_marketplace',
        purchasePrice: 3600,
      })

  assert(
    unknown === null,
    'Unknown fee context must not invent a fee.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 5 — INVALID USER FEE AMOUNT IS REJECTED =====',
  )

  const invalidProvider =
    new UserControlledTransactionFeeEstimateProvider([
      {
        source: 'facebook_marketplace',
        purchasePrice: 3600,
        amount: -10,
      },
    ])

  const invalid =
    await invalidProvider.estimateTransactionFees({
      source: 'facebook_marketplace',
      purchasePrice: 3600,
    })

  assert(
    invalid === null,
    'Negative transaction fee must not become an estimate.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== USER-CONTROLLED TRANSACTION FEE PROVIDER PASSED =====',
  )
}

await main()
