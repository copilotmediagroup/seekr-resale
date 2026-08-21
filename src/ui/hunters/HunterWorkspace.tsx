import { useEffect, useState } from 'react'
import type {
  Hunter,
  HunterCategory,
  MarketplaceSource,
} from '../../domain/hunters/Hunter'
import { createHunter } from '../../domain/hunters/createHunter'
import {
  addHunterCategory,
  addHunterSource,
  removeHunterCategory,
  removeHunterSource,
  updateHunterThreshold,
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

const CATEGORY_OPTIONS: Array<{
  id: HunterCategory
  name: string
  description: string
  badge: string
}> = [
  {
    id: 'vehicles',
    name: 'Vehicles',
    description: 'Cars, trucks, vans, motorcycles, and other vehicles.',
    badge: 'VEH',
  },
  {
    id: 'electronics',
    name: 'Electronics',
    description: 'Phones, computers, gaming, audio, and consumer tech.',
    badge: 'TEC',
  },
  {
    id: 'tools',
    name: 'Tools',
    description: 'Power tools, shop equipment, and professional gear.',
    badge: 'TLS',
  },
  {
    id: 'appliances',
    name: 'Appliances',
    description: 'Washers, dryers, refrigerators, and home appliances.',
    badge: 'APP',
  },
  {
    id: 'furniture',
    name: 'Furniture',
    description: 'Home, office, outdoor, and specialty furniture.',
    badge: 'FUR',
  },
  {
    id: 'collectibles',
    name: 'Collectibles',
    description: 'Trading items, memorabilia, vintage goods, and rarities.',
    badge: 'COL',
  },
  {
    id: 'other',
    name: 'Other',
    description: 'Anything that does not fit the standard categories.',
    badge: 'OTH',
  },
]

const INITIAL_HUNTER_ID = 'hunter-default'

export function HunterWorkspace({ service }: HunterWorkspaceProps) {
  const [hunters, setHunters] = useState<Hunter[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Hunter | null>(null)
  const [status, setStatus] = useState('Loading Hunters...')
  const [draggedHunterId, setDraggedHunterId] = useState<string | null>(null)
  const [dragOverHunterId, setDragOverHunterId] = useState<string | null>(null)
  const [toast, setToast] = useState<{
    message: string
    tone: 'success' | 'error'
  } | null>(null)

  function showToast(
    message: string,
    tone: 'success' | 'error' = 'success',
  ) {
    setToast({ message, tone })
  }

  useEffect(() => {
    if (!toast) {
      return
    }

    const timeout = window.setTimeout(() => {
      setToast(null)
    }, 2600)

    return () => window.clearTimeout(timeout)
  }, [toast])

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

  async function createNewHunter() {
    const id = `hunter-${Date.now()}`

    const hunter = createHunter({
      id,
      name: `Hunter ${hunters.length + 1}`,
    })

    setStatus('Creating Hunter...')

    try {
      await service.saveHunter(hunter)

      const refreshed = await service.listHunters()

      setHunters(refreshed)
      setSelectedId(hunter.id)
      setDraft(hunter)
      setStatus('New Hunter ready')
      showToast('Hunter created')
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to create Hunter'

      setStatus(message)
      showToast(message, 'error')
    }
  }

  async function duplicateHunter(id: string) {
    const source = await service.getHunter(id)

    if (!source) {
      const message = 'Unable to find Hunter to duplicate'
      setStatus(message)
      showToast(message, 'error')
      return
    }

    const duplicate = createHunter({
      id: `hunter-${Date.now()}`,
      name: `${source.name || 'Untitled Hunter'} Copy`,
    })

    duplicate.enabled = source.enabled
    duplicate.location = { ...source.location }
    duplicate.categories = [...source.categories]
    duplicate.sources = [...source.sources]
    duplicate.thresholds = { ...source.thresholds }

    setStatus(`Duplicating ${source.name || 'Hunter'}...`)

    try {
      await service.saveHunter(duplicate)

      const refreshed = await service.listHunters()

      setHunters(refreshed)
      setSelectedId(duplicate.id)
      setDraft(duplicate)
      setStatus(`${duplicate.name} ready`)
      showToast('Hunter duplicated')
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to duplicate Hunter'

      setStatus(message)
      showToast(message, 'error')
    }
  }

  async function removeHunter(id: string) {
    if (hunters.length <= 1) {
      const message = 'At least one Hunter is required'
      setStatus(message)
      showToast(message, 'error')
      return
    }

    const hunter = hunters.find((item) => item.id === id)

    if (!hunter) {
      return
    }

    const confirmed = window.confirm(
      `Remove "${hunter.name || 'Untitled Hunter'}"? This cannot be undone.`,
    )

    if (!confirmed) {
      return
    }

    const removedIndex = hunters.findIndex((item) => item.id === id)

    setStatus(`Removing ${hunter.name || 'Hunter'}...`)

    try {
      await service.deleteHunter(id)

      const refreshed = await service.listHunters()

      setHunters(refreshed)

      if (selectedId === id) {
        const nextIndex = Math.min(
          Math.max(removedIndex, 0),
          refreshed.length - 1,
        )

        const nextHunter = refreshed[nextIndex] ?? refreshed[0] ?? null

        setSelectedId(nextHunter?.id ?? null)
        setDraft(nextHunter)
      }

      setStatus(`${hunter.name || 'Hunter'} removed`)
      showToast('Hunter removed')
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to remove Hunter'

      setStatus(message)
      showToast(message, 'error')
    }
  }

  function beginHunterDrag(id: string) {
    setDraggedHunterId(id)
    setDragOverHunterId(null)
  }

  function moveHunterOver(id: string) {
    if (!draggedHunterId || draggedHunterId === id) {
      setDragOverHunterId(null)
      return
    }

    setDragOverHunterId(id)
  }

  async function finishHunterDrop(targetId: string) {
    if (!draggedHunterId || draggedHunterId === targetId) {
      setDraggedHunterId(null)
      setDragOverHunterId(null)
      return
    }

    const fromIndex = hunters.findIndex(
      (hunter) => hunter.id === draggedHunterId,
    )
    const toIndex = hunters.findIndex(
      (hunter) => hunter.id === targetId,
    )

    if (fromIndex === -1 || toIndex === -1) {
      setDraggedHunterId(null)
      setDragOverHunterId(null)
      return
    }

    const previousOrder = [...hunters]
    const reordered = [...hunters]
    const [movedHunter] = reordered.splice(fromIndex, 1)

    reordered.splice(toIndex, 0, movedHunter)

    setHunters(reordered)
    setDraggedHunterId(null)
    setDragOverHunterId(null)
    setStatus('Saving Hunter order...')

    try {
      await service.reorderHunters(reordered)
      setStatus('Hunter order saved')
      showToast('Hunter order saved')
    } catch (error) {
      setHunters(previousOrder)

      const message =
        error instanceof Error
          ? error.message
          : 'Unable to save Hunter order'

      setStatus(message)
      showToast(message, 'error')
    }
  }

  function cancelHunterDrag() {
    setDraggedHunterId(null)
    setDragOverHunterId(null)
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

  function updateCategory(
    category: HunterCategory,
    selected: boolean,
  ) {
    setDraft((current) => {
      if (!current) {
        return current
      }

      return selected
        ? addHunterCategory(current, category)
        : removeHunterCategory(current, category)
    })
  }

  function updateAllCategories(selected: boolean) {
    setDraft((current) => {
      if (!current) {
        return current
      }

      return CATEGORY_OPTIONS.reduce(
        (updatedHunter, category) =>
          selected
            ? addHunterCategory(updatedHunter, category.id)
            : removeHunterCategory(updatedHunter, category.id),
        current,
      )
    })
  }

  function updateThreshold(
    key: keyof Hunter['thresholds'],
    rawValue: string,
  ) {
    setDraft((current) => {
      if (!current) {
        return current
      }

      const trimmed = rawValue.trim()
      const value = trimmed === '' ? null : Number(trimmed)

      return updateHunterThreshold(current, key, value)
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
      showToast('Hunter saved')
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to save Hunter'

      setStatus(message)
      showToast(message, 'error')
    }
  }

  return (
    <main className="workspace">
      {toast && (
        <div
          aria-live="polite"
          className={`seekrToast ${
            toast.tone === 'error' ? 'seekrToastError' : 'seekrToastSuccess'
          }`}
          role="status"
        >
          <span className="seekrToastIcon">
            {toast.tone === 'error' ? '!' : '✓'}
          </span>

          <span>{toast.message}</span>
        </div>
      )}
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

              <button
                className="newHunterButton"
                onClick={() => void createNewHunter()}
                type="button"
              >
                <span>+</span>
                New Hunter
              </button>
            </div>

            <div className="hunterList">
              {hunters.map((hunter) => (
                <div
                  className={`hunterCard ${
                    selectedId === hunter.id ? 'hunterCardActive' : ''
                  } ${
                    draggedHunterId === hunter.id ? 'hunterCardDragging' : ''
                  } ${
                    dragOverHunterId === hunter.id ? 'hunterCardDragTarget' : ''
                  }`}
                  key={hunter.id}
                  onDragOver={(event) => {
                    event.preventDefault()
                    moveHunterOver(hunter.id)
                  }}
                  onDrop={(event) => {
                    event.preventDefault()
                    void finishHunterDrop(hunter.id)
                  }}
                >
                  {hunters.length > 1 && (
                    <button
                      aria-label={`Reorder ${hunter.name || 'Hunter'}`}
                      className="hunterDragHandle"
                      draggable
                      onClick={(event) => event.stopPropagation()}
                      onDragEnd={cancelHunterDrag}
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = 'move'
                        event.dataTransfer.setData('text/plain', hunter.id)
                        beginHunterDrag(hunter.id)
                      }}
                      title="Drag to reorder"
                      type="button"
                    >
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                    </button>
                  )}

                  <button
                    className="hunterCardSelect hunterCardSelectWithActions"
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

                  <button
                    aria-label={`Duplicate ${hunter.name || 'Hunter'}`}
                    className="hunterDuplicateButton"
                    onClick={() => void duplicateHunter(hunter.id)}
                    title="Duplicate Hunter"
                    type="button"
                  >
                    ⧉
                  </button>

                  {hunters.length > 1 && (
                    <button
                      aria-label={`Remove ${hunter.name || 'Hunter'}`}
                      className="hunterRemoveButton"
                      onClick={() => void removeHunter(hunter.id)}
                      title="Remove Hunter"
                      type="button"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="listFooter">
              Create separate Hunters for different markets, categories,
              locations, and resale strategies.
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
                      CATEGORY_OPTIONS.every((category) =>
                        draft.categories.includes(category.id),
                      )
                        ? 'allCategoriesControlActive'
                        : ''
                    }`}
                    onClick={() => {
                      const allSelected = CATEGORY_OPTIONS.every(
                        (category) =>
                          draft.categories.includes(category.id),
                      )

                      updateAllCategories(!allSelected)
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
                      {CATEGORY_OPTIONS.every((category) =>
                        draft.categories.includes(category.id),
                      )
                        ? 'Selected'
                        : 'Select all'}
                    </span>
                  </button>

                  <div className="categoryGrid">
                    {CATEGORY_OPTIONS.map((category) => {
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
                            updateCategory(category.id, !selected)
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
                            updateThreshold(
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
                            updateThreshold(
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
                            updateThreshold(
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
                            updateThreshold(
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
                              updateThreshold(
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
