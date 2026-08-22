export type DealDecisionStatus =
  | 'buy'
  | 'negotiate'
  | 'pending'

export interface DealDecision {
  status: DealDecisionStatus
  askingPrice: number | null
  seekrBuyPrice: number | null
  priceGap: number | null
}

export interface CalculateDealDecisionInput {
  askingPrice: number | null
  seekrBuyPrice: number | null
}

export const calculateDealDecision = ({
  askingPrice,
  seekrBuyPrice,
}: CalculateDealDecisionInput): DealDecision => {
  if (
    askingPrice === null ||
    seekrBuyPrice === null ||
    !Number.isFinite(askingPrice) ||
    !Number.isFinite(seekrBuyPrice)
  ) {
    return {
      status: 'pending',
      askingPrice,
      seekrBuyPrice,
      priceGap: null,
    }
  }

  const priceGap = seekrBuyPrice - askingPrice

  return {
    status:
      askingPrice <= seekrBuyPrice
        ? 'buy'
        : 'negotiate',
    askingPrice,
    seekrBuyPrice,
    priceGap,
  }
}
