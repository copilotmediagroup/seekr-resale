import type {
  DealEstimateField,
  DealEstimateSet,
  MonetaryEstimate,
} from '../../domain/analysis/DealEstimate'

export type ListingEconomicsValues = Partial<
  Record<DealEstimateField, number>
>

export interface ListingEconomicsPort {
  getListingEconomics(
    listingId: string,
  ): Promise<ListingEconomicsValues>

  saveListingEconomics(
    listingId: string,
    values: ListingEconomicsValues,
  ): Promise<void>

  clearListingEconomics(
    listingId: string,
  ): Promise<void>
}

export const monetaryEstimateFromUserValue = (
  field: keyof DealEstimateSet,
  amount: number,
): MonetaryEstimate => ({
  amount,
  confidence: 'high',
  origin: 'user',
  basis: `User-provided ${field} value.`,
})
