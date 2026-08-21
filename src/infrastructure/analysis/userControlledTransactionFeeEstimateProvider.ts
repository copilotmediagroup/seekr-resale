import type {
  TransactionFeeEstimate,
  TransactionFeeEstimateProvider,
  TransactionFeeEstimateRequest,
} from '../../domain/fees/TransactionFeeEstimateProvider'
import type {
  MarketplaceSource,
} from '../../domain/hunters/Hunter'

export interface UserControlledTransactionFeeQuote {
  source: MarketplaceSource
  purchasePrice: number
  amount: number
}

export class UserControlledTransactionFeeEstimateProvider
  implements TransactionFeeEstimateProvider
{
  private readonly quotes:
    UserControlledTransactionFeeQuote[]

  constructor(
    quotes: UserControlledTransactionFeeQuote[] = [],
  ) {
    this.quotes = [...quotes]
  }

  async estimateTransactionFees(
    request: TransactionFeeEstimateRequest,
  ): Promise<TransactionFeeEstimate | null> {
    const quote = this.quotes.find(
      (candidate) =>
        candidate.source === request.source &&
        candidate.purchasePrice ===
          request.purchasePrice,
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
        'User-controlled transaction fee quote for this marketplace and purchase price.',
    }
  }
}
