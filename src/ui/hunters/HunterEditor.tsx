import type {
  Hunter,
  HunterCategory,
  MarketplaceSource,
} from '../../domain/hunters/Hunter'

interface MarketplaceOption {
  id: MarketplaceSource
  name: string
  description: string
  badge: string
}

interface CategoryOption {
  id: HunterCategory
  name: string
  description: string
  badge: string
}

interface HunterEditorProps {
  draft: Hunter | null
  hasUnsavedChanges: boolean
  isEvaluating: boolean
  marketplaceOptions: MarketplaceOption[]
  categoryOptions: CategoryOption[]
  onNameChange: (name: string) => void
  onEnabledChange: (enabled: boolean) => void
  onPostalCodeChange: (postalCode: string) => void
  onRadiusChange: (value: string) => void
  onMarketplaceChange: (
    source: MarketplaceSource,
    selected: boolean,
  ) => void
  onAllMarketplacesChange: (selected: boolean) => void
  onCategoryChange: (
    category: HunterCategory,
    selected: boolean,
  ) => void
  onAllCategoriesChange: (selected: boolean) => void
  onThresholdChange: (
    key: keyof Hunter['thresholds'],
    rawValue: string,
  ) => void
  onRunIntelligence: () => void | Promise<void>
  onSave: () => void | Promise<void>
}

export function HunterEditor({
  draft,
  hasUnsavedChanges,
  isEvaluating,
  marketplaceOptions,
  categoryOptions,
  onNameChange,
  onEnabledChange,
  onPostalCodeChange,
  onRadiusChange,
  onMarketplaceChange,
  onAllMarketplacesChange,
  onCategoryChange,
  onAllCategoriesChange,
  onThresholdChange,
  onRunIntelligence,
  onSave,
}: HunterEditorProps) {
  return (
          <section className="hunterEditor">
            {draft && (
              <>
                <div className="editorHeading">
                  <div>
                    <span className="panelEyebrow">
                      HUNTER CONFIGURATION
                    </span>
                    <h2>{draft.name || 'Untitled Hunter'}</h2>
                    <p>
                      Tell SEEKR where to search. You control every preference
                      and can change the strategy whenever you want.
                    </p>
                  </div>

                  <label className="toggleControl">
                    <span>
                      <strong>Hunter enabled</strong>
                      <small>
                        {draft.enabled
                          ? 'Actively searching'
                          : 'Search paused'}
                      </small>
                    </span>

                    <input
                      checked={draft.enabled}
                      onChange={(event) =>
                        onEnabledChange(event.target.checked)
                      }
                      type="checkbox"
                    />

                    <i />
                  </label>
                </div>

                <div className="sectionDivider" />

                <div className="configurationHeading">
                  <div>
                    <span className="sectionNumber">01</span>
                    <div>
                      <h3>Search identity & location</h3>
                      <p>
                        Name this strategy and choose the market area SEEKR
                        should watch.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="configurationPanel">
                  <div className="fieldGroup fieldGroupWide">
                    <label htmlFor="hunter-name">Hunter name</label>
                    <input
                      id="hunter-name"
                      onChange={(event) =>
                        onNameChange(event.target.value)
                      }
                      placeholder="My Hunter"
                      type="text"
                      value={draft.name}
                    />
                    <small>
                      Use a name that makes this strategy easy to recognize.
                    </small>
                  </div>

                  <div className="fieldGroup">
                    <label htmlFor="hunter-postal-code">ZIP code</label>
                    <input
                      id="hunter-postal-code"
                      inputMode="numeric"
                      onChange={(event) =>
                        onPostalCodeChange(event.target.value)
                      }
                      placeholder="Enter ZIP"
                      type="text"
                      value={draft.location.postalCode}
                    />
                  </div>

                  <div className="fieldGroup">
                    <label htmlFor="hunter-radius">Search radius</label>

                    <div className="inputWithSuffix">
                      <input
                        id="hunter-radius"
                        inputMode="decimal"
                        min="0"
                        onChange={(event) =>
                          onRadiusChange(event.target.value)
                        }
                        placeholder="Any"
                        type="number"
                        value={draft.location.radiusMiles ?? ''}
                      />
                      <span>MILES</span>
                    </div>

                    <small>
                      Leave blank if you don't want to impose a radius.
                    </small>
                  </div>
                </div>

                <div className="sectionDivider" />

                <div className="configurationHeading">
                  <div>
                    <span className="sectionNumber">02</span>
                    <div>
                      <h3>Marketplaces</h3>
                      <p>
                        Choose one marketplace, several, or every platform
                        currently available to SEEKR.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="marketplaceSection">
                  <button
                    className={`allPlatformsControl ${
                      marketplaceOptions.every((marketplace) =>
                        draft.sources.includes(marketplace.id),
                      )
                        ? 'allPlatformsControlActive'
                        : ''
                    }`}
                    onClick={() => {
                      const allSelected = marketplaceOptions.every(
                        (marketplace) =>
                          draft.sources.includes(marketplace.id),
                      )

                      onAllMarketplacesChange(!allSelected)
                    }}
                    type="button"
                  >
                    <div className="allPlatformsIcon">ALL</div>

                    <div className="marketplaceCopy">
                      <strong>All Platforms</strong>
                      <span>
                        Hunt every marketplace currently connected to SEEKR.
                      </span>
                    </div>

                    <span className="selectionIndicator">
                      {marketplaceOptions.every((marketplace) =>
                        draft.sources.includes(marketplace.id),
                      )
                        ? 'Selected'
                        : 'Select all'}
                    </span>
                  </button>

                  <div className="marketplaceGrid">
                    {marketplaceOptions.map((marketplace) => {
                      const selected = draft.sources.includes(
                        marketplace.id,
                      )

                      return (
                        <button
                          className={`marketplaceCard ${
                            selected ? 'marketplaceCardActive' : ''
                          }`}
                          key={marketplace.id}
                          onClick={() =>
                            onMarketplaceChange(
                              marketplace.id,
                              !selected,
                            )
                          }
                          type="button"
                        >
                          <div className="marketplaceBadge">
                            {marketplace.badge}
                          </div>

                          <div className="marketplaceCopy">
                            <strong>{marketplace.name}</strong>
                            <span>{marketplace.description}</span>
                          </div>

                          <span
                            className={`marketplaceCheck ${
                              selected ? 'marketplaceCheckActive' : ''
                            }`}
                          >
                            {selected ? '✓' : ''}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  <div className="marketplaceSummary">
                    <span>SEARCHING</span>
                    <strong>
                      {draft.sources.length === 0
                        ? 'No marketplaces selected'
                        : `${draft.sources.length} marketplace${
                            draft.sources.length === 1 ? '' : 's'
                          }`}
                    </strong>
                  </div>
                </div>

                <div className="sectionDivider" />

                <div className="configurationHeading">
                  <div>
                    <span className="sectionNumber">03</span>
                    <div>
                      <h3>Categories</h3>
                      <p>
                        Choose the types of resale opportunities this Hunter
                        should look for.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="categorySection">
                  <button
                    className={`allCategoriesControl ${
                      categoryOptions.every((category) =>
                        draft.categories.includes(category.id),
                      )
                        ? 'allCategoriesControlActive'
                        : ''
                    }`}
                    onClick={() => {
                      const allSelected = categoryOptions.every(
                        (category) =>
                          draft.categories.includes(category.id),
                      )

                      onAllCategoriesChange(!allSelected)
                    }}
                    type="button"
                  >
                    <div className="allCategoriesIcon">ALL</div>

                    <div className="categoryCopy">
                      <strong>All Categories</strong>
                      <span>
                        Let this Hunter search across every available category.
                      </span>
                    </div>

                    <span className="categorySelectionIndicator">
                      {categoryOptions.every((category) =>
                        draft.categories.includes(category.id),
                      )
                        ? 'Selected'
                        : 'Select all'}
                    </span>
                  </button>

                  <div className="categoryGrid">
                    {categoryOptions.map((category) => {
                      const selected = draft.categories.includes(
                        category.id,
                      )

                      return (
                        <button
                          className={`categoryCard ${
                            selected ? 'categoryCardActive' : ''
                          }`}
                          key={category.id}
                          onClick={() =>
                            onCategoryChange(category.id, !selected)
                          }
                          type="button"
                        >
                          <div className="categoryBadge">
                            {category.badge}
                          </div>

                          <div className="categoryCopy">
                            <strong>{category.name}</strong>
                            <span>{category.description}</span>
                          </div>

                          <span
                            className={`categoryCheck ${
                              selected ? 'categoryCheckActive' : ''
                            }`}
                          >
                            {selected ? '✓' : ''}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  <div className="categorySummary">
                    <span>WATCHING</span>
                    <strong>
                      {draft.categories.length === 0
                        ? 'No categories selected'
                        : `${draft.categories.length} categor${
                            draft.categories.length === 1
                              ? 'y'
                              : 'ies'
                          }`}
                    </strong>
                  </div>
                </div>

                <div className="sectionDivider" />

                <div className="configurationHeading">
                  <div>
                    <span className="sectionNumber">04</span>
                    <div>
                      <h3>Deal requirements</h3>
                      <p>
                        Set the economics that matter to you. Every requirement
                        is optional and entirely under your control.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="thresholdSection">
                  <div className="thresholdIntro">
                    <div className="thresholdIntroMark">USER</div>

                    <div>
                      <strong>Your strategy, your numbers.</strong>
                      <span>
                        Leave any field blank when you do not want SEEKR to
                        filter opportunities by that requirement.
                      </span>
                    </div>
                  </div>

                  <div className="thresholdGrid">
                    <div className="thresholdField">
                      <div className="thresholdFieldHeading">
                        <label htmlFor="minimum-spend">
                          Minimum spend
                        </label>
                        <span>OPTIONAL</span>
                      </div>

                      <div className="thresholdInput">
                        <span className="thresholdPrefix">$</span>
                        <input
                          id="minimum-spend"
                          inputMode="decimal"
                          min="0"
                          onChange={(event) =>
                            onThresholdChange(
                              'minimumSpend',
                              event.target.value,
                            )
                          }
                          placeholder="No minimum"
                          type="number"
                          value={draft.thresholds.minimumSpend ?? ''}
                        />
                      </div>

                      <small>
                        Ignore listings priced below this amount.
                      </small>
                    </div>

                    <div className="thresholdField">
                      <div className="thresholdFieldHeading">
                        <label htmlFor="maximum-spend">
                          Maximum spend
                        </label>
                        <span>OPTIONAL</span>
                      </div>

                      <div className="thresholdInput">
                        <span className="thresholdPrefix">$</span>
                        <input
                          id="maximum-spend"
                          inputMode="decimal"
                          min="0"
                          onChange={(event) =>
                            onThresholdChange(
                              'maximumSpend',
                              event.target.value,
                            )
                          }
                          placeholder="No maximum"
                          type="number"
                          value={draft.thresholds.maximumSpend ?? ''}
                        />
                      </div>

                      <small>
                        Set the most you are willing to pay.
                      </small>
                    </div>

                    <div className="thresholdField">
                      <div className="thresholdFieldHeading">
                        <label htmlFor="minimum-profit">
                          Minimum expected profit
                        </label>
                        <span>OPTIONAL</span>
                      </div>

                      <div className="thresholdInput">
                        <span className="thresholdPrefix">$</span>
                        <input
                          id="minimum-profit"
                          inputMode="decimal"
                          min="0"
                          onChange={(event) =>
                            onThresholdChange(
                              'minimumExpectedProfit',
                              event.target.value,
                            )
                          }
                          placeholder="Any profit"
                          type="number"
                          value={
                            draft.thresholds.minimumExpectedProfit ?? ''
                          }
                        />
                      </div>

                      <small>
                        Only surface deals meeting your profit target.
                      </small>
                    </div>

                    <div className="thresholdField">
                      <div className="thresholdFieldHeading">
                        <label htmlFor="minimum-roi">
                          Minimum ROI
                        </label>
                        <span>OPTIONAL</span>
                      </div>

                      <div className="thresholdInput thresholdInputSuffix">
                        <input
                          id="minimum-roi"
                          inputMode="decimal"
                          min="0"
                          onChange={(event) =>
                            onThresholdChange(
                              'minimumRoiPercent',
                              event.target.value,
                            )
                          }
                          placeholder="Any ROI"
                          type="number"
                          value={
                            draft.thresholds.minimumRoiPercent ?? ''
                          }
                        />
                        <span className="thresholdSuffix">%</span>
                      </div>

                      <small>
                        Require at least this return on your investment.
                      </small>
                    </div>

                    <div className="thresholdField thresholdFieldWide">
                      <div className="thresholdFieldHeading">
                        <label htmlFor="minimum-seekr-score">
                          Minimum SEEKR score
                        </label>
                        <span>OPTIONAL</span>
                      </div>

                      <div className="seekrScoreRow">
                        <div className="thresholdInput">
                          <input
                            id="minimum-seekr-score"
                            inputMode="decimal"
                            min="0"
                            onChange={(event) =>
                              onThresholdChange(
                                'minimumSeekrScore',
                                event.target.value,
                              )
                            }
                            placeholder="Any score"
                            type="number"
                            value={
                              draft.thresholds.minimumSeekrScore ?? ''
                            }
                          />
                        </div>

                        <div className="seekrScoreExplanation">
                          <strong>Opportunity quality filter</strong>
                          <span>
                            Set the minimum SEEKR intelligence score you want
                            a deal to meet before it surfaces.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="thresholdSummary">
                    <div>
                      <span>ACTIVE REQUIREMENTS</span>
                      <strong>
                        {
                          Object.values(draft.thresholds).filter(
                            (value) => value !== null,
                          ).length
                        }
                        {' / 5'}
                      </strong>
                    </div>

                    <p>
                      Blank fields remain unrestricted. SEEKR does not insert
                      its own financial limits into your Hunter.
                    </p>
                  </div>
                </div>

                <div className="editorActions">
                  <div
                    className={`saveNote ${
                      hasUnsavedChanges ? 'saveNoteDirty' : ''
                    }`}
                  >
                    <span className="saveDot" />
                    {hasUnsavedChanges
                      ? 'Unsaved changes'
                      : 'All changes saved'}
                  </div>

                  <div className="editorActionButtons">
                    <button
                      className="secondaryButton"
                      disabled={isEvaluating}
                      onClick={() => void onRunIntelligence()}
                      type="button"
                    >
                      {isEvaluating ? 'Analyzing...' : 'Run Intelligence'}
                    </button>
                    <button
                      className="primaryButton"
                      onClick={() => void onSave()}
                      type="button"
                    >
                      Save Hunter
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
  )
}
