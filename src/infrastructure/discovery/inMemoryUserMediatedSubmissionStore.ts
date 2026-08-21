import type { MarketplaceSource } from '../../domain/hunters/Hunter'
import type { DiscoveryRequest } from '../../domain/discovery/DiscoveryRequest'
import type {
  UserMediatedListingSubmission,
  UserMediatedSubmissionResolver,
} from './userMediatedMarketplaceAdapter'

const cloneSubmission = (
  submission: UserMediatedListingSubmission,
): UserMediatedListingSubmission => ({
  source: submission.source,
  submittedAt: submission.submittedAt,
  listings: submission.listings.map((listing) => ({
    ...listing,
  })),
})

const createKey = (
  hunterId: string,
  source: MarketplaceSource,
): string => `${hunterId}::${source}`

export class InMemoryUserMediatedSubmissionStore {
  private readonly submissions =
    new Map<string, UserMediatedListingSubmission>()

  submit(
    hunterId: string,
    submission: UserMediatedListingSubmission,
  ): void {
    this.submissions.set(
      createKey(hunterId, submission.source),
      cloneSubmission(submission),
    )
  }

  resolve(
    request: DiscoveryRequest,
  ): UserMediatedListingSubmission | null {
    const submission = this.submissions.get(
      createKey(request.hunterId, request.source),
    )

    return submission
      ? cloneSubmission(submission)
      : null
  }

  clear(
    hunterId: string,
    source: MarketplaceSource,
  ): void {
    this.submissions.delete(createKey(hunterId, source))
  }

  clearHunter(hunterId: string): void {
    const prefix = `${hunterId}::`

    for (const key of this.submissions.keys()) {
      if (key.startsWith(prefix)) {
        this.submissions.delete(key)
      }
    }
  }

  createResolver(): UserMediatedSubmissionResolver {
    return (request) => this.resolve(request)
  }
}
