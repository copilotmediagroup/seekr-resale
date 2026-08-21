import {
  UserControlledTaxesAndRegistrationEstimateProvider,
} from './userControlledTaxesAndRegistrationEstimateProvider'

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
    '===== SCENARIO 1 — EXACT USER TAX QUOTE IS RETURNED =====',
  )

  const provider =
    new UserControlledTaxesAndRegistrationEstimateProvider([
      {
        buyerPostalCode: '33619',
        listingLocationText: 'Tampa, FL',
        purchasePrice: 3600,
        amount: 225,
      },
    ])

  const estimate =
    await provider.estimateTaxesAndRegistration({
      buyerPostalCode: '33619',
      listingLocationText: 'Tampa, FL',
      purchasePrice: 3600,
    })

  assert(
    estimate?.amount === 225,
    'Exact user taxes and registration quote was not returned.',
  )

  assert(
    estimate?.confidence === 'high',
    'User-controlled tax quote should carry high confidence.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 2 — LOCATION MATCH IS NORMALIZED =====',
  )

  const normalized =
    await provider.estimateTaxesAndRegistration({
      buyerPostalCode: '33619',
      listingLocationText: '  tampa, fl  ',
      purchasePrice: 3600,
    })

  assert(
    normalized?.amount === 225,
    'Normalized location did not match tax quote.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 3 — DIFFERENT PURCHASE PRICE REMAINS NULL =====',
  )

  const differentPurchase =
    await provider.estimateTaxesAndRegistration({
      buyerPostalCode: '33619',
      listingLocationText: 'Tampa, FL',
      purchasePrice: 4000,
    })

  assert(
    differentPurchase === null,
    'Different purchase price must not reuse a stale tax quote.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 4 — UNKNOWN CONTEXT REMAINS NULL =====',
  )

  const unknown =
    await provider.estimateTaxesAndRegistration({
      buyerPostalCode: '33619',
      listingLocationText: 'Orlando, FL',
      purchasePrice: 3600,
    })

  assert(
    unknown === null,
    'Unknown purchase context must not invent taxes.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 5 — INVALID USER TAX AMOUNT IS REJECTED =====',
  )

  const invalidProvider =
    new UserControlledTaxesAndRegistrationEstimateProvider([
      {
        buyerPostalCode: '33619',
        listingLocationText: 'Tampa, FL',
        purchasePrice: 3600,
        amount: -50,
      },
    ])

  const invalid =
    await invalidProvider.estimateTaxesAndRegistration({
      buyerPostalCode: '33619',
      listingLocationText: 'Tampa, FL',
      purchasePrice: 3600,
    })

  assert(
    invalid === null,
    'Negative tax quote must not become an estimate.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== USER-CONTROLLED TAXES & REGISTRATION PROVIDER PASSED =====',
  )
}

await main()
