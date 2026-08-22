import type { HunterDiscoveryIntelligenceResult } from '../../application/discovery/evaluateHunterDiscovery'
import type { ListingEconomicsPort } from '../../application/hunters/listingEconomicsPort'
import { HunterDealEconomicsEditor } from './HunterDealEconomicsEditor'

interface HunterOpportunityResultsProps {
  result: HunterDiscoveryIntelligenceResult | null
  isEvaluating: boolean
  economics: ListingEconomicsPort
  onEconomicsSaved: () => Promise<void>
}

const formatMoney = (value: number | null): string => {
  if (value === null) {
    return 'Not available'
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

const formatPercent = (value: number | null): string => {
  if (value === null) {
    return 'Not available'
  }

  return `${value.toFixed(1)}%`
}

const formatDecisionGap = (
  priceGap: number | null,
): string => {
  if (priceGap === null) {
    return 'Waiting for complete deal intelligence'
  }

  if (priceGap > 0) {
    return `${formatMoney(
      priceGap,
    )} below SEEKR Buy Price`
  }

  if (priceGap < 0) {
    return `${formatMoney(
      Math.abs(priceGap),
    )} above SEEKR Buy Price`
  }

  return 'Seller is exactly at SEEKR Buy Price'
}

const formatSource = (source: string): string =>
  source
    .split('_')
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(' ')

export function HunterOpportunityResults({
  result,
  isEvaluating,
  economics: economicsPort,
  onEconomicsSaved,
}: HunterOpportunityResultsProps) {
  if (isEvaluating) {
    return (
      <section className="opportunityResultsPanel">
        <div className="opportunityResultsHeader">
          <div>
            <div className="eyebrow">LIVE INTELLIGENCE</div>
            <h2>Analyzing opportunities</h2>
            <p>
              SEEKR is evaluating the listings returned by this Hunter.
            </p>
          </div>
        </div>

        <div className="opportunityLoadingState">
          <span className="opportunityLoadingPulse" />
          Building opportunity intelligence...
        </div>
      </section>
    )
  }

  if (!result) {
    return (
      <section className="opportunityResultsPanel">
        <div className="opportunityResultsHeader">
          <div>
            <div className="eyebrow">HUNTER RESULTS</div>
            <h2>Opportunities</h2>
            <p>
              Run intelligence on a saved Hunter to analyze its current
              marketplace opportunities.
            </p>
          </div>
        </div>

        <div className="opportunityEmptyState">
          <strong>No intelligence run yet</strong>
          <span>
            Your results will appear here without changing the Hunter settings
            above.
          </span>
        </div>
      </section>
    )
  }

  const successfulEvaluations = result.evaluations.length
  const failedEvaluations = result.evaluationFailures.length
  const sourceFailures = result.discoveryFailures.length

  return (
    <section className="opportunityResultsPanel">
      <div className="opportunityResultsHeader">
        <div>
          <div className="eyebrow">HUNTER RESULTS</div>
          <h2>Opportunities</h2>
          <p>
            Current marketplace intelligence for this Hunter.
          </p>
        </div>

        <div className="opportunityResultsSummary">
          <div>
            <span>FOUND</span>
            <strong>{result.listings.length}</strong>
          </div>
          <div>
            <span>ANALYZED</span>
            <strong>{successfulEvaluations}</strong>
          </div>
        </div>
      </div>

      {(failedEvaluations > 0 || sourceFailures > 0) && (
        <div className="opportunityWarning">
          Some intelligence is incomplete.
          {sourceFailures > 0 &&
            ` ${sourceFailures} marketplace source${
              sourceFailures === 1 ? '' : 's'
            } had a discovery problem.`}
          {failedEvaluations > 0 &&
            ` ${failedEvaluations} listing${
              failedEvaluations === 1 ? '' : 's'
            } could not be fully evaluated.`}
        </div>
      )}

      {result.evaluations.length === 0 ? (
        <div className="opportunityEmptyState">
          <strong>No evaluated opportunities yet</strong>
          <span>
            SEEKR did not receive an opportunity it could evaluate from this
            run.
          </span>
        </div>
      ) : (
        <div className="opportunityGrid">
          {result.evaluations.map((intelligence) => {
            const { listing } = intelligence
            const evaluation = intelligence.evaluation
            const analysis = evaluation.evaluation.analysis
            const qualification =
              evaluation.evaluation.qualification
            const economics = analysis.economics
            const decision =
              evaluation.status === 'evaluated'
                ? evaluation.evaluation.decision
                : null
            const progressiveResaleValue =
              evaluation.estimation.estimates.estimatedResaleValue
            const missing = evaluation.estimation.missing

            return (
              <article
                className="opportunityCard"
                key={listing.id}
              >
                <div className="opportunityCardTopline">
                  <span className="opportunitySource">
                    {formatSource(listing.source)}
                  </span>

                  <span
                    className={`opportunityQualification opportunityQualification-${qualification.status}`}
                  >
                    {qualification.status}
                  </span>
                </div>

                <div className="opportunityCardHeading">
                  <div>
                    <h3>{listing.title || 'Untitled listing'}</h3>

                    <div className="opportunityMeta">
                      {listing.locationText && (
                        <span>{listing.locationText}</span>
                      )}

                      {listing.listingAgeDays !== null && (
                        <span>
                          {listing.listingAgeDays}{' '}
                          {listing.listingAgeDays === 1 ? 'day' : 'days'} listed
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="opportunityAskingPrice">
                    <span>ASKING</span>
                    <strong>
                      {formatMoney(listing.askingPrice)}
                    </strong>
                  </div>
                </div>

                <div
                  className={`opportunityDecisionPanel opportunityDecisionPanel-${
                    decision?.status ?? 'pending'
                  }`}
                >
                  <div className="opportunityDecisionPrimary">
                    <span>SEEKR DECISION</span>
                    <strong>
                      {(decision?.status ?? 'pending').toUpperCase()}
                    </strong>
                  </div>

                  <div className="opportunityDecisionPrice">
                    <span>SEEKR BUY PRICE</span>
                    <strong>
                      {formatMoney(
                        decision?.seekrBuyPrice ??
                          economics?.expectedPurchasePrice ??
                          null,
                      )}
                    </strong>
                  </div>

                  <div className="opportunityDecisionGap">
                    {formatDecisionGap(
                      decision?.priceGap ?? null,
                    )}
                  </div>
                </div>

                <div className="opportunityMetrics">
                  <div>
                    <span>RESALE VALUE</span>
                    <strong>
                      {formatMoney(
                        economics?.estimatedResaleValue ??
                          progressiveResaleValue?.amount ??
                          null,
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>EXPECTED PROFIT</span>
                    <strong>
                      {formatMoney(
                        economics?.estimatedProfit ?? null,
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>ROI</span>
                    <strong>
                      {formatPercent(
                        economics?.roiPercent ?? null,
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>SEEKR SCORE</span>
                    <strong>
                      {analysis.seekrScore === null
                        ? 'Not available'
                        : Math.round(analysis.seekrScore)}
                    </strong>
                  </div>
                </div>

                <HunterDealEconomicsEditor
                  economics={economicsPort}
                  isEvaluating={isEvaluating}
                  listingId={listing.id}
                  onSaved={onEconomicsSaved}
                />

                {missing.length > 0 && (
                  <div className="opportunityMissingData">
                    <strong>Waiting on more information</strong>
                    <span>
                      {missing
                        .map((field) =>
                          field
                            .replace(/^estimated/, '')
                            .replace(/^expected/, '')
                            .replace(/([A-Z])/g, ' $1')
                            .trim()
                            .toLowerCase(),
                        )
                        .join(', ')}
                    </span>
                  </div>
                )}

                <div className="opportunityCardFooter">
                  <span>
                    {listing.postedAt
                      ? `Posted ${listing.postedAt}`
                      : 'Posted date unavailable'}
                  </span>

                  <a
                    href={listing.sourceUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    View original listing
                  </a>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
