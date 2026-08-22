import type { DealEstimateOverrides } from '../../application/analysis/estimateDeal'
import type { ListingEconomicsRepository } from '../../domain/listingEconomics/listingEconomicsRepository'

const STORAGE_KEY = 'seekr.listingEconomics'

type StoredListingEconomics =
  Record<string, DealEstimateOverrides>

export class LocalStorageListingEconomicsRepository
  implements ListingEconomicsRepository
{
  async getByListingId(
    listingId: string,
  ): Promise<DealEstimateOverrides> {
    const stored = this.read()
    return stored[listingId] ?? {}
  }

  async save(
    listingId: string,
    overrides: DealEstimateOverrides,
  ): Promise<void> {
    const stored = this.read()

    stored[listingId] = {
      ...overrides,
    }

    this.write(stored)
  }

  async delete(listingId: string): Promise<void> {
    const stored = this.read()

    delete stored[listingId]

    this.write(stored)
  }

  private read(): StoredListingEconomics {
    const raw = localStorage.getItem(STORAGE_KEY)

    if (raw === null) {
      return {}
    }

    const parsed: unknown = JSON.parse(raw)

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return {}
    }

    return parsed as StoredListingEconomics
  }

  private write(
    stored: StoredListingEconomics,
  ): void {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(stored),
    )
  }
}
