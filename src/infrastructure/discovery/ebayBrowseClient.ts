import type { MarketplaceAcquisitionRequest } from '../../domain/discovery/MarketplaceAcquisitionRequest'

export interface EbayBrowseAmount {
  value?: string | null
  currency?: string | null
}

export interface EbayBrowseItemLocation {
  city?: string | null
  stateOrProvince?: string | null
  postalCode?: string | null
  country?: string | null
}

export interface EbayBrowseAspect {
  name?: string | null
  value?: string | null
}

export interface EbayBrowseItemSummary {
  itemId?: string | null
  legacyItemId?: string | null
  itemWebUrl?: string | null
  title?: string | null
  price?: EbayBrowseAmount | null
  currentBidPrice?: EbayBrowseAmount | null
  condition?: string | null
  itemLocation?: EbayBrowseItemLocation | null
  itemCreationDate?: string | null
  itemOriginDate?: string | null
  localizedAspects?: EbayBrowseAspect[] | null
}

export interface EbayBrowseSearchResult {
  itemSummaries?: EbayBrowseItemSummary[] | null
}

export interface EbayBrowseClient {
  search(
    request: MarketplaceAcquisitionRequest,
  ): Promise<EbayBrowseSearchResult>
}
