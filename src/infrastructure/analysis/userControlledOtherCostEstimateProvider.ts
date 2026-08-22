import type {
  OtherCostEstimate,
  OtherCostEstimateProvider,
  OtherCostEstimateRequest,
} from '../../domain/costs/OtherCostEstimateProvider'

export interface UserControlledOtherCostQuote {
  listingId: string
  amount: number
}

export class UserControlledOtherCostEstimateProvider
  implements OtherCostEstimateProvider
{
  private readonly quotes: UserControlledOtherCostQuote[]

  constructor(
    quotes: UserControlledOtherCostQuote[] = [],
  ) {
    this.quotes = [...quotes]
  }

  async estimateOtherCosts(
    request: OtherCostEstimateRequest,
  ): Promise<OtherCostEstimate | null> {
    const quote = this.quotes.find(
      (candidate) =>
        candidate.listingId === request.listingId,
    )

    if (quote === undefined) {
      return null
    }

    if (
      !Number.isFinite(quote.amount) ||
      quote.amount < 0
    ) {
      return null
    }

    return {
      amount: quote.amount,
      confidence: 'high',
      basis:
        'User-supplied miscellaneous cost allowance for this listing.',
    }
  }
}
