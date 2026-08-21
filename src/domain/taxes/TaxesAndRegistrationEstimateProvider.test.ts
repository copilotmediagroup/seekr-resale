import type {
  TaxesAndRegistrationEstimateProvider,
  TaxesAndRegistrationEstimateRequest,
} from './TaxesAndRegistrationEstimateProvider'

const assert = (
  condition: boolean,
  message: string,
): void => {
  if (!condition) {
    throw new Error(message)
  }
}

class RecordingTaxesAndRegistrationProvider
  implements TaxesAndRegistrationEstimateProvider
{
  lastRequest:
    TaxesAndRegistrationEstimateRequest | null = null

  async estimateTaxesAndRegistration(
    request: TaxesAndRegistrationEstimateRequest,
  ) {
    this.lastRequest = request

    return {
      amount: 250,
      confidence: 'medium' as const,
      basis: 'Test taxes and registration estimate.',
    }
  }
}

const main = async (): Promise<void> => {
  console.log(
    '===== SCENARIO 1 — PORT PRESERVES AVAILABLE JURISDICTION EVIDENCE =====',
  )

  const provider =
    new RecordingTaxesAndRegistrationProvider()

  const result =
    await provider.estimateTaxesAndRegistration({
      buyerPostalCode: '33578',
      listingLocationText: 'Tampa, FL',
      purchasePrice: 5000,
    })

  assert(
    provider.lastRequest?.buyerPostalCode === '33578',
    'Buyer postal code was not preserved.',
  )

  assert(
    provider.lastRequest?.listingLocationText ===
      'Tampa, FL',
    'Listing location text was not preserved.',
  )

  assert(
    provider.lastRequest?.purchasePrice === 5000,
    'Purchase price was not preserved.',
  )

  assert(
    result?.amount === 250,
    'Estimate amount was not preserved.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 2 — PROVIDER MAY DECLINE WHEN JURISDICTION EVIDENCE IS INSUFFICIENT =====',
  )

  const unavailableProvider:
    TaxesAndRegistrationEstimateProvider = {
      async estimateTaxesAndRegistration() {
        return null
      },
    }

  const unavailable =
    await unavailableProvider
      .estimateTaxesAndRegistration({
        buyerPostalCode: '',
        listingLocationText: null,
        purchasePrice: 5000,
      })

  assert(
    unavailable === null,
    'Provider must be able to decline an unsupported estimate.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== TAXES & REGISTRATION INTELLIGENCE PORT PASSED =====',
  )
}

await main()
