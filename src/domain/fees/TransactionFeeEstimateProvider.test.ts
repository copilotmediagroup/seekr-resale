import type {
  TransactionFeeEstimateProvider,
  TransactionFeeEstimateRequest,
} from './TransactionFeeEstimateProvider'

const assert = (
  condition: boolean,
  message: string,
): void => {
  if (!condition) {
    throw new Error(message)
  }
}

class RecordingTransactionFeeProvider
  implements TransactionFeeEstimateProvider
{
  lastRequest:
    | TransactionFeeEstimateRequest
    | null = null

  async estimateTransactionFees(
    request: TransactionFeeEstimateRequest,
  ) {
    this.lastRequest = request

    return {
      amount: 125,
      confidence: 'high' as const,
      basis: 'Test transaction fee evidence.',
    }
  }
}

const main = async (): Promise<void> => {
  console.log(
    '===== SCENARIO 1 — PORT PRESERVES SOURCE AND PURCHASE PRICE =====',
  )

  const provider =
    new RecordingTransactionFeeProvider()

  const result =
    await provider.estimateTransactionFees({
      source: 'facebook_marketplace',
      purchasePrice: 2500,
    })

  assert(
    provider.lastRequest?.source ===
      'facebook_marketplace',
    'Marketplace source was not preserved.',
  )

  assert(
    provider.lastRequest?.purchasePrice === 2500,
    'Purchase price was not preserved.',
  )

  assert(
    result?.amount === 125,
    'Transaction fee amount was not preserved.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 2 — PROVIDER MAY DECLINE WHEN FEE EVIDENCE IS INSUFFICIENT =====',
  )

  const unavailableProvider:
    TransactionFeeEstimateProvider = {
      async estimateTransactionFees() {
        return null
      },
    }

  const unavailable =
    await unavailableProvider
      .estimateTransactionFees({
        source: 'craigslist',
        purchasePrice: 2500,
      })

  assert(
    unavailable === null,
    'Unsupported transaction fee must remain null.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== TRANSACTION FEE INTELLIGENCE PORT PASSED =====',
  )
}

await main()
