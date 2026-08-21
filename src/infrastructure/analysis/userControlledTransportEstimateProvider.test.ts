import {
  UserControlledTransportEstimateProvider,
} from './userControlledTransportEstimateProvider'

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
    '===== SCENARIO 1 — EXACT USER QUOTE IS RETURNED =====',
  )

  const provider =
    new UserControlledTransportEstimateProvider([
      {
        originPostalCode: '33619',
        destinationLocationText: 'Tampa, FL',
        amount: 85,
      },
    ])

  const estimate =
    await provider.estimateTransport({
      originPostalCode: '33619',
      destinationLocationText: 'Tampa, FL',
    })

  assert(
    estimate?.amount === 85,
    'Exact user transport quote was not returned.',
  )

  assert(
    estimate?.confidence === 'high',
    'User-controlled quote should carry high confidence.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 2 — DESTINATION MATCH IS NORMALIZED =====',
  )

  const normalized =
    await provider.estimateTransport({
      originPostalCode: '33619',
      destinationLocationText: '  tampa, fl  ',
    })

  assert(
    normalized?.amount === 85,
    'Normalized destination did not match user quote.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 3 — UNKNOWN ROUTE REMAINS NULL =====',
  )

  const unknown =
    await provider.estimateTransport({
      originPostalCode: '33619',
      destinationLocationText: 'Orlando, FL',
    })

  assert(
    unknown === null,
    'Unknown route must not invent transport cost.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 4 — INVALID USER AMOUNT IS REJECTED =====',
  )

  const invalidProvider =
    new UserControlledTransportEstimateProvider([
      {
        originPostalCode: '33619',
        destinationLocationText: 'Tampa, FL',
        amount: -25,
      },
    ])

  const invalid =
    await invalidProvider.estimateTransport({
      originPostalCode: '33619',
      destinationLocationText: 'Tampa, FL',
    })

  assert(
    invalid === null,
    'Negative transport quote must not become an estimate.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== USER-CONTROLLED TRANSPORT PROVIDER PASSED =====',
  )
}

await main()
