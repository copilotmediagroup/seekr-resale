import type {
  MarketplaceSource,
} from '../../domain/hunters/Hunter'
import type {
  MarketplaceAcquisitionRequest,
} from '../../domain/discovery/MarketplaceAcquisitionRequest'
import type {
  UserMediatedListingSubmission,
  UserMediatedSubmissionResolver,
} from './userMediatedMarketplaceAdapter'

const STORAGE_KEY = 'seekr.marketplaceSubmissions'

interface StoredSubmissionEntry {
  hunterId: string
  submission: UserMediatedListingSubmission
}

const cloneSubmission = (
  submission: UserMediatedListingSubmission,
): UserMediatedListingSubmission => ({
  source: submission.source,
  submittedAt: submission.submittedAt,
  listings: submission.listings.map((listing) => ({
    ...listing,
    vehicle: listing.vehicle
      ? { ...listing.vehicle }
      : listing.vehicle,
  })),
})

const createKey = (
  hunterId: string,
  source: MarketplaceSource,
): string => `${hunterId}::${source}`

export class LocalStorageUserMediatedSubmissionStore {
  private readAll(): Record<
    string,
    StoredSubmissionEntry
  > {
    const raw = localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return {}
    }

    try {
      const parsed = JSON.parse(raw)

      if (
        parsed === null ||
        typeof parsed !== 'object' ||
        Array.isArray(parsed)
      ) {
        return {}
      }

      return parsed
    } catch {
      return {}
    }
  }

  private writeAll(
    submissions: Record<
      string,
      StoredSubmissionEntry
    >,
  ): void {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(submissions),
    )
  }

  submit(
    hunterId: string,
    submission: UserMediatedListingSubmission,
  ): void {
    const submissions = this.readAll()

    submissions[
      createKey(hunterId, submission.source)
    ] = {
      hunterId,
      submission: cloneSubmission(submission),
    }

    this.writeAll(submissions)
  }

  append(
    hunterId: string,
    submission: UserMediatedListingSubmission,
  ): void {
    const submissions = this.readAll()
    const key = createKey(
      hunterId,
      submission.source,
    )

    const existing =
      submissions[key]?.submission

    const listings = [
      ...(existing?.listings ?? []),
      ...submission.listings,
    ]

    const deduplicatedListings = Array.from(
      new Map(
        listings.map((listing) => [
          listing.sourceListingId,
          {
            ...listing,
            vehicle: listing.vehicle
              ? { ...listing.vehicle }
              : listing.vehicle,
          },
        ]),
      ).values(),
    )

    submissions[key] = {
      hunterId,
      submission: cloneSubmission({
        source: submission.source,
        submittedAt: submission.submittedAt,
        listings: deduplicatedListings,
      }),
    }

    this.writeAll(submissions)
  }

  resolve(
    request: MarketplaceAcquisitionRequest,
  ): UserMediatedListingSubmission | null {
    if (request.correlationId === null) {
      return null
    }

    const submissions = this.readAll()

    const stored =
      submissions[
        createKey(
          request.correlationId,
          request.source,
        )
      ]

    return stored
      ? cloneSubmission(stored.submission)
      : null
  }

  clear(
    hunterId: string,
    source: MarketplaceSource,
  ): void {
    const submissions = this.readAll()

    delete submissions[
      createKey(hunterId, source)
    ]

    this.writeAll(submissions)
  }

  clearHunter(hunterId: string): void {
    const submissions = this.readAll()
    const prefix = `${hunterId}::`

    for (const key of Object.keys(submissions)) {
      if (key.startsWith(prefix)) {
        delete submissions[key]
      }
    }

    this.writeAll(submissions)
  }

  createResolver(): UserMediatedSubmissionResolver {
    return (request) => this.resolve(request)
  }
}
