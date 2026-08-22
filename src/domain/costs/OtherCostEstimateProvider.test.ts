import type {
  OtherCostEstimateProvider,
  OtherCostEstimateRequest,
} from './OtherCostEstimateProvider'

const assert = (
  condition: boolean,
  message: string,
): void => {
  if (!condition) {
    throw new Error(message)
  }
}

const requests: OtherCostEstimateRequest[] = []

const provider: OtherCostEstimateProvider = {
  async estimateOtherCosts(request) {
    requests.push(request)
    return null
  },
}

const main = async (): Promise<void> => {
  console.log(
    '===== SCENARIO 1 — PORT PRESERVES LISTING IDENTITY =====',
  )

  const result = await provider.estimateOtherCosts({
    listingId: 'listing-123',
  })

  assert(
    requests[0]?.listingId === 'listing-123',
    'Other-cost request did not preserve listing identity.',
  )

  assert(
    result === null,
    'Provider must be allowed to decline when other-cost evidence is absent.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== OTHER COST INTELLIGENCE PORT PASSED =====',
  )
}

await main()
