import type {
  TransportEstimate,
  TransportEstimateProvider,
  TransportEstimateRequest,
} from '../../domain/transport/TransportEstimateProvider'

export interface UserControlledTransportQuote {
  originPostalCode: string
  destinationLocationText: string
  amount: number
}

export class UserControlledTransportEstimateProvider
  implements TransportEstimateProvider
{
  private readonly quotes:
    UserControlledTransportQuote[]

  constructor(
    quotes: UserControlledTransportQuote[] = [],
  ) {
    this.quotes = [...quotes]
  }

  async estimateTransport(
    request: TransportEstimateRequest,
  ): Promise<TransportEstimate | null> {
    const origin =
      request.originPostalCode.trim()

    const destination =
      request.destinationLocationText
        .trim()
        .toLowerCase()

    const quote = this.quotes.find(
      (candidate) =>
        candidate.originPostalCode.trim() === origin &&
        candidate.destinationLocationText
          .trim()
          .toLowerCase() === destination,
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
        'User-controlled transport quote for this origin and destination.',
    }
  }
}
