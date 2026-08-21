import type { NormalizedListing } from '../../domain/discovery/NormalizedListing'
import type { RawMarketplaceListing } from '../../domain/discovery/RawMarketplaceListing'

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

const normalizeRequiredText = (value: string): string => value.trim()

const normalizeOptionalText = (
  value: string | null,
): string | null => {
  if (value === null) {
    return null
  }

  const normalized = value.trim()

  return normalized.length > 0 ? normalized : null
}

const calculateListingAgeDays = (
  postedAt: string | null,
  discoveredAt: string,
): number | null => {
  if (postedAt === null) {
    return null
  }

  const postedTime = Date.parse(postedAt)
  const discoveredTime = Date.parse(discoveredAt)

  if (
    !Number.isFinite(postedTime) ||
    !Number.isFinite(discoveredTime)
  ) {
    return null
  }

  const ageMilliseconds = discoveredTime - postedTime

  if (ageMilliseconds < 0) {
    return null
  }

  return Math.floor(ageMilliseconds / MILLISECONDS_PER_DAY)
}

export const normalizeMarketplaceListing = (
  raw: RawMarketplaceListing,
): NormalizedListing => ({
  id: `${raw.source}:${raw.sourceListingId}`,

  source: raw.source,
  sourceListingId: raw.sourceListingId,
  sourceUrl: normalizeRequiredText(raw.url),

  title: normalizeRequiredText(raw.title),
  description: normalizeOptionalText(raw.description),

  askingPrice: raw.askingPrice,
  locationText: normalizeOptionalText(raw.locationText),

  postedAt: raw.postedAt,
  discoveredAt: raw.discoveredAt,

  listingAgeDays: calculateListingAgeDays(
    raw.postedAt,
    raw.discoveredAt,
  ),
})
