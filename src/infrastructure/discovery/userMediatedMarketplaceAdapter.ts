import type { MarketplaceSource } from '../../domain/hunters/Hunter'
import type { MarketplaceAcquisitionRequest } from '../../domain/discovery/MarketplaceAcquisitionRequest'
import type {
  MarketplaceAcquisitionAdapter,
  MarketplaceAcquisitionCapability,
  MarketplaceAcquisitionContext,
} from '../../domain/discovery/MarketplaceAcquisition'
import type { RawMarketplaceListing } from '../../domain/discovery/RawMarketplaceListing'
import type { VehicleListingMetadata } from '../../domain/discovery/VehicleListingMetadata'

export interface UserSubmittedMarketplaceListing {
  sourceListingId: string
  url: string
  title: string
  description?: string | null
  askingPrice?: number | null
  vehicle?: VehicleListingMetadata | null
  locationText?: string | null
  postedAt?: string | null
}

export interface UserMediatedListingSubmission {
  source: MarketplaceSource
  listings: UserSubmittedMarketplaceListing[]
  submittedAt: string
}

export type UserMediatedSubmissionResolver = (
  request: MarketplaceAcquisitionRequest,
) =>
  | UserMediatedListingSubmission
  | null
  | Promise<UserMediatedListingSubmission | null>

const cloneListing = (
  listing: RawMarketplaceListing,
): RawMarketplaceListing => ({
  ...listing,
})

export class UserMediatedMarketplaceAdapter
  implements MarketplaceAcquisitionAdapter
{
  readonly source: MarketplaceSource
  readonly capability: MarketplaceAcquisitionCapability

  private readonly resolveSubmission: UserMediatedSubmissionResolver

  constructor(
    source: MarketplaceSource,
    resolveSubmission: UserMediatedSubmissionResolver,
  ) {
    this.source = source
    this.resolveSubmission = resolveSubmission

    this.capability = {
      source,
      acquisitionMode: 'user_mediated',
      automationLevel: 'assisted',
      requiresUserSession: false,
      requiresExplicitAuthorization: true,
      supportsBackgroundDiscovery: false,
    }
  }

  async acquire(
    request: MarketplaceAcquisitionRequest,
    context: MarketplaceAcquisitionContext,
  ): Promise<RawMarketplaceListing[]> {
    if (request.source !== this.source) {
      throw new Error(
        `Acquisition adapter ${this.source} cannot acquire source ${request.source}`,
      )
    }

    if (!context.userAuthorized) {
      throw new Error(
        'Explicit user authorization is required before marketplace ingestion.',
      )
    }

    const submission =
      await this.resolveSubmission(request)

    if (submission === null) {
      return []
    }

    if (submission.source !== this.source) {
      throw new Error(
        `Submitted marketplace source ${submission.source} does not match adapter source ${this.source}`,
      )
    }

    return submission.listings.map(
      (listing): RawMarketplaceListing => ({
        source: this.source,
        sourceListingId: listing.sourceListingId,
        url: listing.url,
        title: listing.title,
        description: listing.description ?? null,
        askingPrice: listing.askingPrice ?? null,
        vehicle: listing.vehicle
          ? { ...listing.vehicle }
          : null,
        locationText: listing.locationText ?? null,
        postedAt: listing.postedAt ?? null,
        discoveredAt: submission.submittedAt,
      }),
    ).map(cloneListing)
  }
}
