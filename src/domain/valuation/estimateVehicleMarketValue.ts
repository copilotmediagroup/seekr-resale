import type { VehicleListingMetadata } from '../discovery/VehicleListingMetadata'
import type { MonetaryEstimate } from '../analysis/DealEstimate'
import type { VehicleMarketComparable } from './VehicleMarketComparable'

export interface EstimateVehicleMarketValueInput {
  vehicle: VehicleListingMetadata
  comparables: VehicleMarketComparable[]
}

const normalizeText = (
  value: string | null,
): string | null => {
  const normalized = value?.trim().toLowerCase() ?? ''
  return normalized.length > 0 ? normalized : null
}

const median = (values: number[]): number => {
  const sorted = [...values].sort((left, right) => left - right)
  const middle = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 1) {
    return sorted[middle]
  }

  return (sorted[middle - 1] + sorted[middle]) / 2
}

const isComparableVehicle = (
  vehicle: VehicleListingMetadata,
  comparable: VehicleMarketComparable,
): boolean => {
  if (
    vehicle.year === null ||
    normalizeText(vehicle.make) === null ||
    normalizeText(vehicle.model) === null
  ) {
    return false
  }

  if (
    normalizeText(comparable.make) !== normalizeText(vehicle.make) ||
    normalizeText(comparable.model) !== normalizeText(vehicle.model)
  ) {
    return false
  }

  if (Math.abs(comparable.year - vehicle.year) > 1) {
    return false
  }

  const vehicleTrim = normalizeText(vehicle.trim)
  const comparableTrim = normalizeText(comparable.trim)

  if (
    vehicleTrim !== null &&
    comparableTrim !== null &&
    vehicleTrim !== comparableTrim
  ) {
    return false
  }

  if (
    vehicle.mileage !== null &&
    comparable.mileage !== null
  ) {
    const mileageTolerance = Math.max(
      25000,
      vehicle.mileage * 0.25,
    )

    if (
      Math.abs(comparable.mileage - vehicle.mileage) >
      mileageTolerance
    ) {
      return false
    }
  }

  return (
    Number.isFinite(comparable.askingPrice) &&
    comparable.askingPrice > 0
  )
}

const removePriceOutliers = (
  comparables: VehicleMarketComparable[],
): VehicleMarketComparable[] => {
  if (comparables.length < 4) {
    return comparables
  }

  const center = median(
    comparables.map((comparable) => comparable.askingPrice),
  )

  if (center <= 0) {
    return []
  }

  return comparables.filter((comparable) => {
    const deviation =
      Math.abs(comparable.askingPrice - center) / center

    return deviation <= 0.35
  })
}

const determineConfidence = (
  comparableCount: number,
): MonetaryEstimate['confidence'] => {
  if (comparableCount >= 5) {
    return 'high'
  }

  if (comparableCount >= 3) {
    return 'medium'
  }

  return 'low'
}

export const estimateVehicleMarketValue = ({
  vehicle,
  comparables,
}: EstimateVehicleMarketValueInput): MonetaryEstimate | null => {
  const accepted = comparables.filter((comparable) =>
    isComparableVehicle(vehicle, comparable),
  )

  const withoutOutliers = removePriceOutliers(accepted)

  if (withoutOutliers.length === 0) {
    return null
  }

  const amount = Math.round(
    median(
      withoutOutliers.map(
        (comparable) => comparable.askingPrice,
      ),
    ),
  )

  return {
    amount,
    confidence: determineConfidence(withoutOutliers.length),
    origin: 'automated',
    basis:
      `Median asking price from ${withoutOutliers.length} ` +
      `accepted vehicle market comparable` +
      `${withoutOutliers.length === 1 ? '' : 's'}.`,
  }
}
