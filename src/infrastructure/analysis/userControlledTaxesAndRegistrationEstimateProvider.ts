import type {
  TaxesAndRegistrationEstimate,
  TaxesAndRegistrationEstimateProvider,
  TaxesAndRegistrationEstimateRequest,
} from '../../domain/taxes/TaxesAndRegistrationEstimateProvider'

export interface UserControlledTaxesAndRegistrationQuote {
  buyerPostalCode: string
  listingLocationText: string | null
  purchasePrice: number
  amount: number
}

export class UserControlledTaxesAndRegistrationEstimateProvider
  implements TaxesAndRegistrationEstimateProvider
{
  private readonly quotes:
    UserControlledTaxesAndRegistrationQuote[]

  constructor(
    quotes:
      UserControlledTaxesAndRegistrationQuote[] = [],
  ) {
    this.quotes = [...quotes]
  }

  async estimateTaxesAndRegistration(
    request: TaxesAndRegistrationEstimateRequest,
  ): Promise<TaxesAndRegistrationEstimate | null> {
    const buyerPostalCode =
      request.buyerPostalCode.trim()

    const listingLocation =
      request.listingLocationText
        ?.trim()
        .toLowerCase() ?? null

    const quote = this.quotes.find(
      (candidate) => {
        const candidateLocation =
          candidate.listingLocationText
            ?.trim()
            .toLowerCase() ?? null

        return (
          candidate.buyerPostalCode.trim() ===
            buyerPostalCode &&
          candidateLocation === listingLocation &&
          candidate.purchasePrice ===
            request.purchasePrice
        )
      },
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
        'User-controlled taxes and registration quote for this purchase context.',
    }
  }
}
