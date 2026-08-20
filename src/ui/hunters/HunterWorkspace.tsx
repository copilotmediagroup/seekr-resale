import { useEffect, useState } from 'react'
import type { Hunter, MarketplaceSource } from '../../domain/hunters/Hunter'
import { createHunter } from '../../domain/hunters/createHunter'
import {
  addHunterSource,
  removeHunterSource,
} from '../../domain/hunters/updateHunter'
import type { HunterService } from '../../application/hunters/hunterService'

interface HunterWorkspaceProps {
  service: HunterService
}

const MARKETPLACE_OPTIONS: Array<{
  id: MarketplaceSource
  name: string
  description: string
  badge: string
}> = [
  {
    id: 'facebook_marketplace',
    name: 'Facebook Marketplace',
    description: 'Local marketplace listings and seller opportunities.',
    badge: 'FB',
  },
  {
    id: 'craigslist',
    name: 'Craigslist',
    description: 'Local classifieds and direct seller listings.',
    badge: 'CL',
  },
]

const INITIAL_HUNTER_ID = 'hunter-default'

export function HunterWorkspace({ service }: HunterWorkspaceProps) {
  const [hunters, setHunters] = useState<Hunter[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Hunter | null>(null)
  const [status, setStatus] = useState('Loading Hunters...')

  useEffect(() => {
    let active = true

    async function load() {
      try {
        let loaded = await service.listHunters()

        if (loaded.length === 0) {
          const firstHunter = createHunter({
            id: INITIAL_HUNTER_ID,
          })

          await service.saveHunter(firstHunter)
          loaded = await service.listHunters()
        }

        if (!active) {
          return
        }

        const first = loaded[0] ?? null

        setHunters(loaded)
        setSelectedId(first?.id ?? null)
        setDraft(first)
        setStatus(
          loaded.length === 1
            ? '1 Hunter ready'
            : `${loaded.length} Hunters ready`,
        )
      } catch (error) {
        if (!active) {
          return
        }

        setStatus(
          error instanceof Error
            ? error.message
            : 'Unable to load Hunters',
        )
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [service])

  async function selectHunter(id: string) {
    const hunter = await service.getHunter(id)

    if (!hunter) {
      return
    }

    setSelectedId(id)
    setDraft(hunter)
    setStatus(`Editing ${hunter.name}`)
  }

  function updateName(name: string) {
    setDraft((current) =>
      current ? { ...current, name } : current,
    )
  }

  function updateEnabled(enabled: boolean) {
    setDraft((current) =>
      current ? { ...current, enabled } : current,
    )
  }

  function updatePostalCode(postalCode: string) {
    setDraft((current) =>
      current
        ? {
            ...current,
            location: {
              ...current.location,
              postalCode,
            },
          }
        : current,
    )
  }

  function updateRadius(value: string) {
    setDraft((current) => {
      if (!current) {
        return current
      }

      const trimmed = value.trim()

      return {
        ...current,
        location: {
          ...current.location,
          radiusMiles: trimmed === '' ? null : Number(trimmed),
        },
      }
    })
  }

  function updateMarketplace(
    source: MarketplaceSource,
    selected: boolean,
  ) {
    setDraft((current) => {
      if (!current) {
        return current
      }

      return selected
        ? addHunterSource(current, source)
        : removeHunterSource(current, source)
    })
  }

  function updateAllMarketplaces(selected: boolean) {
    setDraft((current) => {
      if (!current) {
        return current
      }

      return MARKETPLACE_OPTIONS.reduce(
        (updatedHunter, marketplace) =>
          selected
            ? addHunterSource(updatedHunter, marketplace.id)
            : removeHunterSource(updatedHunter, marketplace.id),
        current,
      )
    })
  }

  async function saveHunter() {
    if (!draft) {
      return
    }

    setStatus('Saving...')

    try {
      await service.saveHunter(draft)

      const refreshed = await service.listHunters()
      const saved =
        refreshed.find((hunter) => hunter.id === draft.id) ?? draft

      setHunters(refreshed)
      setSelectedId(saved.id)
      setDraft(saved)
      setStatus('Hunter saved')
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : 'Unable to save Hunter',
      )
    }
  }

  return (
    <main className="workspace">
      <div className="shell">
        <header className="topbar">
          <div className="brandBlock">
            <div className="brandMark">S</div>
            <div>
              <div className="brand">SEEKR</div>
              <div className="brandSubline">Resale Intelligence</div>
            </div>
          </div>

          <div className="topbarStatus">
            <span className="liveDot" />
            {status}
          </div>
        </header>

        <div className="pageHeading">
          <div>
            <div className="eyebrow">OPPORTUNITY ENGINE</div>
            <h1>Hunters</h1>
            <p>
              Build precise search strategies that continuously look for
              resale opportunities on your terms.
            </p>
          </div>

          <div className="headingMetric">
            <span>ACTIVE HUNTERS</span>
            <strong>
              {hunters.filter((hunter) => hunter.enabled).length}
            </strong>
          </div>
        </div>

        <section className="workspaceGrid">
          <aside className="hunterListPanel">
            <div className="panelHeader">
              <div>
                <span className="panelEyebrow">YOUR HUNTERS</span>
                <strong>{hunters.length}</strong>
              </div>
            </div>

            <div className="hunterList">
              {hunters.map((hunter) => (
                <button
                  className={`hunterCard ${
                    selectedId === hunter.id ? 'hunterCardActive' : ''
                  }`}
                  key={hunter.id}
                  onClick={() => void selectHunter(hunter.id)}
                  type="button"
                >
                  <div className="hunterCardMain">
                    <span className="hunterCardName">
                      {hunter.name || 'Untitled Hunter'}
                    </span>

                    <span className="hunterCardMeta">
                      {hunter.location.postalCode || 'Location not set'}
                      {' · '}
                      {hunter.location.radiusMiles === null
                        ? 'Any radius'
                        : `${hunter.location.radiusMiles} mi`}
                    </span>
                  </div>

                  <span
                    className={`hunterState ${
                      hunter.enabled ? 'hunterStateEnabled' : ''
                    }`}
                  >
                    <span />
                    {hunter.enabled ? 'ON' : 'OFF'}
                  </span>
                </button>
              ))}
            </div>

            <div className="listFooter">
              More Hunter management controls will be added after the
              configuration workflow is validated.
            </div>
          </aside>

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
                        updateEnabled(event.target.checked)
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
                        updateName(event.target.value)
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
                        updatePostalCode(event.target.value)
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
                          updateRadius(event.target.value)
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
                      MARKETPLACE_OPTIONS.every((marketplace) =>
                        draft.sources.includes(marketplace.id),
                      )
                        ? 'allPlatformsControlActive'
                        : ''
                    }`}
                    onClick={() => {
                      const allSelected = MARKETPLACE_OPTIONS.every(
                        (marketplace) =>
                          draft.sources.includes(marketplace.id),
                      )

                      updateAllMarketplaces(!allSelected)
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
                      {MARKETPLACE_OPTIONS.every((marketplace) =>
                        draft.sources.includes(marketplace.id),
                      )
                        ? 'Selected'
                        : 'Select all'}
                    </span>
                  </button>

                  <div className="marketplaceGrid">
                    {MARKETPLACE_OPTIONS.map((marketplace) => {
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
                            updateMarketplace(
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

                <div className="editorActions">
                  <div className="saveNote">
                    <span className="saveDot" />
                    Settings stay under your control
                  </div>

                  <button
                    className="primaryButton"
                    onClick={() => void saveHunter()}
                    type="button"
                  >
                    Save Hunter
                  </button>
                </div>
              </>
            )}
          </section>
        </section>
      </div>
    </main>
  )
}
