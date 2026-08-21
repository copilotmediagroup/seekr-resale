import type { RawMarketplaceListing } from '../../domain/discovery/RawMarketplaceListing'
import type { VehicleMarketComparable } from '../../domain/valuation/VehicleMarketComparable'

const normalizeRequiredText = (
  value: string | null,
): string | null => {
  if (value === null) {
    return null
  }

  const normalized = value.trim()

  return normalized.length > 0 ? normalized : null
}

export const mapMarketplaceListingToVehicleComparable = (
  listing: RawMarketplaceListing,
): VehicleMarketComparable | null => {
  const vehicle = listing.vehicle

  if (
    vehicle === null ||
    vehicle.year === null ||
    vehicle.make === null ||
    vehicle.model === null ||
    listing.askingPrice === null
  ) {
    return null
  }

  const make = normalizeRequiredText(vehicle.make)
  const model = normalizeRequiredText(vehicle.model)

  if (
    make === null ||
    model === null ||
    !Number.isFinite(vehicle.year) ||
    !Number.isFinite(listing.askingPrice) ||
    listing.askingPrice <= 0
  ) {
    return null
  }

  return {
    id: `${listing.source}:${listing.sourceListingId}`,
    source: listing.source,
    sourceUrl: normalizeRequiredText(listing.url),
    year: vehicle.year,
    make,
    model,
    trim: normalizeRequiredText(vehicle.trim),
    mileage: vehicle.mileage,
    condition: normalizeRequiredText(vehicle.condition),
    locationText: normalizeRequiredText(listing.locationText),
    askingPrice: listing.askingPrice,
    observedAt: listing.discoveredAt,
  }
}
