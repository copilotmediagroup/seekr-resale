import type { Hunter } from './Hunter'

export interface HunterValidationError {
  field: string
  message: string
}

export const validateHunter = (
  hunter: Hunter,
): HunterValidationError[] => {
  const errors: HunterValidationError[] = []

  const {
    minimumSpend,
    maximumSpend,
    minimumExpectedProfit,
    minimumRoiPercent,
    minimumSeekrScore,
  } = hunter.thresholds

  if (
    minimumSpend !== null &&
    maximumSpend !== null &&
    maximumSpend < minimumSpend
  ) {
    errors.push({
      field: 'thresholds.maximumSpend',
      message: 'Maximum spend cannot be less than minimum spend.',
    })
  }

  if (minimumSpend !== null && minimumSpend < 0) {
    errors.push({
      field: 'thresholds.minimumSpend',
      message: 'Minimum spend cannot be negative.',
    })
  }

  if (maximumSpend !== null && maximumSpend < 0) {
    errors.push({
      field: 'thresholds.maximumSpend',
      message: 'Maximum spend cannot be negative.',
    })
  }

  if (
    minimumExpectedProfit !== null &&
    minimumExpectedProfit < 0
  ) {
    errors.push({
      field: 'thresholds.minimumExpectedProfit',
      message: 'Minimum expected profit cannot be negative.',
    })
  }

  if (minimumRoiPercent !== null && minimumRoiPercent < 0) {
    errors.push({
      field: 'thresholds.minimumRoiPercent',
      message: 'Minimum ROI cannot be negative.',
    })
  }

  if (minimumSeekrScore !== null && minimumSeekrScore < 0) {
    errors.push({
      field: 'thresholds.minimumSeekrScore',
      message: 'Minimum SEEKR score cannot be negative.',
    })
  }

  if (
    hunter.location.radiusMiles !== null &&
    hunter.location.radiusMiles <= 0
  ) {
    errors.push({
      field: 'location.radiusMiles',
      message: 'Search radius must be greater than zero.',
    })
  }

  return errors
}
