import type {
  MarketplaceAcquisitionAdapter,
  MarketplaceAcquisitionCapability,
  MarketplaceAcquisitionContext,
} from '../../domain/discovery/MarketplaceAcquisition'
import type { MarketplaceAcquisitionRequest } from '../../domain/discovery/MarketplaceAcquisitionRequest'
import type { RawMarketplaceListing } from '../../domain/discovery/RawMarketplaceListing'
import type { VehicleListingMetadata } from '../../domain/discovery/VehicleListingMetadata'
import type {
  EbayBrowseAspect,
  EbayBrowseClient,
  EbayBrowseItemLocation,
  EbayBrowseItemSummary,
} from './ebayBrowseClient'

const textOrNull = (
  value: string | null | undefined,
): string | null => {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim()

  return normalized.length > 0
    ? normalized
    : null
}

const numberOrNull = (
  value: string | null | undefined,
): number | null => {
  if (value === null || value === undefined) {
    return null
  }

  const normalized =
    value.replace(/[^0-9.-]/g, '')

  if (normalized.length === 0) {
    return null
  }

  const parsed = Number(normalized)

  return Number.isFinite(parsed)
    ? parsed
    : null
}

const integerOrNull = (
  value: string | null | undefined,
): number | null => {
  const parsed = numberOrNull(value)

  return parsed === null
    ? null
    : Math.round(parsed)
}

const normalizeAspectName = (
  value: string | null | undefined,
): string =>
  value
    ?.trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') ?? ''

const findAspect = (
  aspects: EbayBrowseAspect[] | null | undefined,
  names: string[],
): string | null => {
  if (!aspects) {
    return null
  }

  const accepted = new Set(
    names.map(normalizeAspectName),
  )

  for (const aspect of aspects) {
    if (
      accepted.has(
        normalizeAspectName(aspect.name),
      )
    ) {
      const value = textOrNull(aspect.value)

      if (value !== null) {
        return value
      }
    }
  }

  return null
}

const mapVehicle = (
  item: EbayBrowseItemSummary,
): VehicleListingMetadata | null => {
  const aspects = item.localizedAspects

  const year =
    integerOrNull(
      findAspect(aspects, [
        'Year',
        'Model Year',
      ]),
    )

  const make =
    findAspect(aspects, [
      'Make',
      'Manufacturer',
    ])

  const model =
    findAspect(aspects, [
      'Model',
    ])

  const trim =
    findAspect(aspects, [
      'Trim',
      'Submodel',
    ])

  const mileage =
    integerOrNull(
      findAspect(aspects, [
        'Mileage',
        'Odometer',
        'Odometer Reading',
      ]),
    )

  const vin =
    findAspect(aspects, [
      'VIN',
      'Vehicle Identification Number',
    ])

  const condition =
    textOrNull(item.condition)

  const hasVehicleEvidence =
    year !== null ||
    make !== null ||
    model !== null ||
    trim !== null ||
    mileage !== null ||
    vin !== null

  if (!hasVehicleEvidence) {
    return null
  }

  return {
    year,
    make,
    model,
    trim,
    mileage,
    vin,
    condition,
  }
}

const mapLocation = (
  location: EbayBrowseItemLocation | null | undefined,
): string | null => {
  if (!location) {
    return null
  }

  const parts = [
    textOrNull(location.city),
    textOrNull(location.stateOrProvince),
    textOrNull(location.postalCode),
    textOrNull(location.country),
  ].filter(
    (value): value is string =>
      value !== null,
  )

  return parts.length > 0
    ? parts.join(', ')
    : null
}

const mapPrice = (
  item: EbayBrowseItemSummary,
): number | null => {
  const fixedPrice =
    numberOrNull(item.price?.value)

  if (
    fixedPrice !== null &&
    fixedPrice > 0
  ) {
    return fixedPrice
  }

  const currentBid =
    numberOrNull(item.currentBidPrice?.value)

  if (
    currentBid !== null &&
    currentBid > 0
  ) {
    return currentBid
  }

  return null
}

const mapItem = (
  item: EbayBrowseItemSummary,
  discoveredAt: string,
): RawMarketplaceListing | null => {
  const sourceListingId =
    textOrNull(item.itemId) ??
    textOrNull(item.legacyItemId)

  const url =
    textOrNull(item.itemWebUrl)

  const title =
    textOrNull(item.title)

  if (
    sourceListingId === null ||
    url === null ||
    title === null
  ) {
    return null
  }

  return {
    source: 'ebay',
    sourceListingId,
    url,
    title,
    description: null,
    askingPrice: mapPrice(item),
    vehicle: mapVehicle(item),
    locationText:
      mapLocation(item.itemLocation),
    postedAt:
      textOrNull(item.itemOriginDate) ??
      textOrNull(item.itemCreationDate),
    discoveredAt,
  }
}

export class EbayMarketplaceAcquisitionAdapter
  implements MarketplaceAcquisitionAdapter
{
  readonly source = 'ebay' as const

  readonly capability:
    MarketplaceAcquisitionCapability = {
      source: 'ebay',
      acquisitionMode: 'official_api',
      automationLevel: 'automatic',
      requiresUserSession: false,
      requiresExplicitAuthorization: false,
      supportsBackgroundDiscovery: true,
    }

  private readonly client: EbayBrowseClient

  constructor(client: EbayBrowseClient) {
    this.client = client
  }

  async acquire(
    request: MarketplaceAcquisitionRequest,
    context: MarketplaceAcquisitionContext,
  ): Promise<RawMarketplaceListing[]> {
    void context
    if (request.source !== this.source) {
      throw new Error(
        `Acquisition adapter ${this.source} cannot acquire source ${request.source}`,
      )
    }

    const response =
      await this.client.search(request)

    const discoveredAt =
      new Date().toISOString()

    return (
      response.itemSummaries ?? []
    ).flatMap((item) => {
      const mapped =
        mapItem(item, discoveredAt)

      return mapped === null
        ? []
        : [mapped]
    })
  }
}
