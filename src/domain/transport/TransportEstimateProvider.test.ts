import type {
  TransportEstimateProvider,
  TransportEstimateRequest,
} from './TransportEstimateProvider'

const assert = (
  condition: boolean,
  message: string,
): void => {
  if (!condition) {
    throw new Error(message)
  }
}

class RecordingTransportProvider
  implements TransportEstimateProvider
{
  lastRequest: TransportEstimateRequest | null = null

  async estimateTransport(
    request: TransportEstimateRequest,
  ) {
    this.lastRequest = request

    return {
      amount: 175,
      confidence: 'medium' as const,
      basis: 'Test transport quote.',
    }
  }
}

const main = async (): Promise<void> => {
  console.log(
    '===== SCENARIO 1 — PORT PRESERVES ORIGIN AND DESTINATION =====',
  )

  const provider =
    new RecordingTransportProvider()

  const result = await provider.estimateTransport({
    originPostalCode: '33619',
    destinationLocationText: 'Tampa, FL',
  })

  assert(
    provider.lastRequest?.originPostalCode === '33619',
    'Transport origin postal code was not preserved.',
  )

  assert(
    provider.lastRequest?.destinationLocationText ===
      'Tampa, FL',
    'Transport destination was not preserved.',
  )

  assert(
    result?.amount === 175,
    'Transport quote amount was not preserved.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 2 — PROVIDER MAY DECLINE WHEN EVIDENCE IS INSUFFICIENT =====',
  )

  const unavailableProvider: TransportEstimateProvider = {
    async estimateTransport() {
      return null
    },
  }

  const unavailable =
    await unavailableProvider.estimateTransport({
      originPostalCode: '33619',
      destinationLocationText: 'Unknown',
    })

  assert(
    unavailable === null,
    'Transport provider must be able to decline an unsupported estimate.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== TRANSPORT INTELLIGENCE PORT PASSED =====',
  )
}

await main()
