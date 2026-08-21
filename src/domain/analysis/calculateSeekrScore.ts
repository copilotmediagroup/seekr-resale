import type {
  SeekrScore,
  SeekrScoreComponent,
  SeekrScoreInput,
} from './SeekrScore'

const clamp = (
  value: number,
  minimum: number,
  maximum: number,
): number => Math.min(maximum, Math.max(minimum, value))

const roundScore = (value: number): number =>
  Math.round(value * 100) / 100

const scoreProfitPotential = (
  estimatedProfit: number,
): SeekrScoreComponent => {
  const maximumScore = 30

  /*
   * Version 1 policy:
   * $0 profit = 0 points
   * $3,000+ expected profit = full 30 points
   * Linear between those boundaries.
   */
  const score = roundScore(
    clamp(estimatedProfit / 3000, 0, 1) * maximumScore,
  )

  return {
    key: 'profitPotential',
    score,
    maximumScore,
    explanation:
      estimatedProfit <= 0
        ? 'Expected profit is not positive.'
        : estimatedProfit >= 3000
          ? 'Expected profit reaches the current maximum profit opportunity band.'
          : `Expected profit of $${estimatedProfit.toFixed(
              0,
            )} earns proportional profit-potential credit.`,
  }
}

const scoreRoiStrength = (
  roiPercent: number,
): SeekrScoreComponent => {
  const maximumScore = 30

  /*
   * Version 1 policy:
   * 0% ROI = 0 points
   * 50%+ ROI = full 30 points
   * Linear between those boundaries.
   */
  const score = roundScore(
    clamp(roiPercent / 50, 0, 1) * maximumScore,
  )

  return {
    key: 'roiStrength',
    score,
    maximumScore,
    explanation:
      roiPercent <= 0
        ? 'Expected ROI is not positive.'
        : roiPercent >= 50
          ? 'Expected ROI reaches the current maximum ROI-strength band.'
          : `Expected ROI of ${roiPercent.toFixed(
              1,
            )}% earns proportional ROI-strength credit.`,
  }
}

const scoreAcquisitionDiscount = (
  askingPrice: number,
  expectedPurchasePrice: number,
): SeekrScoreComponent => {
  const maximumScore = 20

  if (askingPrice <= 0) {
    return {
      key: 'acquisitionDiscount',
      score: 0,
      maximumScore,
      explanation:
        'Acquisition discount cannot be measured without a positive asking price.',
    }
  }

  const discountPercent =
    ((askingPrice - expectedPurchasePrice) / askingPrice) * 100

  /*
   * Version 1 policy:
   * No discount = 0 points
   * 25%+ expected discount = full 20 points
   */
  const score = roundScore(
    clamp(discountPercent / 25, 0, 1) * maximumScore,
  )

  return {
    key: 'acquisitionDiscount',
    score,
    maximumScore,
    explanation:
      discountPercent <= 0
        ? 'Expected purchase price does not improve on asking price.'
        : discountPercent >= 25
          ? 'Expected purchase discount reaches the current maximum discount band.'
          : `Expected purchase price is ${discountPercent.toFixed(
              1,
            )}% below asking price.`,
  }
}

const scoreListingOpportunity = (
  listingAgeDays: number | null,
): SeekrScoreComponent => {
  const maximumScore = 20

  if (listingAgeDays === null) {
    return {
      key: 'listingOpportunity',
      score: 0,
      maximumScore,
      explanation:
        'Listing age is unavailable, so no listing-opportunity credit is assigned.',
    }
  }

  /*
   * Version 1 policy:
   *
   * 0-2 days   = 2 points
   * 3-6 days   = 6 points
   * 7-13 days  = 12 points
   * 14-29 days = 18 points
   * 30+ days   = 20 points
   *
   * Older listings receive more opportunity credit because
   * seller flexibility may increase, but this component is
   * capped at only 20% of the overall score.
   */
  let score: number

  if (listingAgeDays >= 30) {
    score = 20
  } else if (listingAgeDays >= 14) {
    score = 18
  } else if (listingAgeDays >= 7) {
    score = 12
  } else if (listingAgeDays >= 3) {
    score = 6
  } else {
    score = 2
  }

  return {
    key: 'listingOpportunity',
    score,
    maximumScore,
    explanation: `Listing has been active for ${listingAgeDays} day${
      listingAgeDays === 1 ? '' : 's'
    }.`,
  }
}

export const calculateSeekrScore = (
  input: SeekrScoreInput,
): SeekrScore => {
  const components: SeekrScoreComponent[] = [
    scoreProfitPotential(input.estimatedProfit),
    scoreRoiStrength(input.roiPercent),
    scoreAcquisitionDiscount(
      input.askingPrice,
      input.expectedPurchasePrice,
    ),
    scoreListingOpportunity(input.listingAgeDays),
  ]

  const total = roundScore(
    components.reduce(
      (sum, component) => sum + component.score,
      0,
    ),
  )

  return {
    total,
    maximumScore: 100,
    components,
  }
}
