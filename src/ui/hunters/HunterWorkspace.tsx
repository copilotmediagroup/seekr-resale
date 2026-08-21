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
  updateHunterEnabled,
  updateHunterThreshold,
} from '../../domain/hunters/updateHunter'
import type { HunterService } from '../../application/hunters/hunterService'
import { HunterListPanel } from './HunterListPanel'
import { HunterEditor } from './HunterEditor'

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
  const [pendingSelectionId, setPendingSelectionId] = useState<string | null>(null)
  const [toast, setToast] = useState<{
    message: string
    tone: 'success' | 'error'
  } | null>(null)

  const savedHunter =
    selectedId === null
      ? null
      : hunters.find((hunter) => hunter.id === selectedId) ?? null

  const hasUnsavedChanges =
    draft !== null &&
    savedHunter !== null &&
    JSON.stringify(draft) !== JSON.stringify(savedHunter)

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
    if (!hasUnsavedChanges) {
      return
    }

    function protectUnsavedChanges(event: BeforeUnloadEvent) {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', protectUnsavedChanges)

    return () => {
      window.removeEventListener('beforeunload', protectUnsavedChanges)
    }
  }, [hasUnsavedChanges])

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

  async function openHunter(id: string) {
    const hunter = await service.getHunter(id)

    if (!hunter) {
      return
    }

    setSelectedId(id)
    setDraft(hunter)
    setStatus(`Editing ${hunter.name}`)
  }

  async function selectHunter(id: string) {
    if (id === selectedId) {
      return
    }

    if (hasUnsavedChanges) {
      setPendingSelectionId(id)
      return
    }

    await openHunter(id)
  }

  async function discardUnsavedChanges() {
    const targetId = pendingSelectionId

    setPendingSelectionId(null)

    if (!targetId) {
      return
    }

    await openHunter(targetId)
    showToast('Changes discarded')
  }

  function keepEditing() {
    setPendingSelectionId(null)
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

  async function toggleHunterEnabled(id: string) {
    const hunter = hunters.find((item) => item.id === id)

    if (!hunter) {
      return
    }

    const updated = updateHunterEnabled(hunter, !hunter.enabled)
    const previousHunters = hunters
    const previousDraft = draft

    setHunters((current) =>
      current.map((item) =>
        item.id === id ? updated : item,
      ),
    )

    if (selectedId === id) {
      setDraft(updated)
    }

    setStatus(
      updated.enabled
        ? `Activating ${hunter.name || 'Hunter'}...`
        : `Pausing ${hunter.name || 'Hunter'}...`,
    )

    try {
      await service.saveHunter(updated)

      const message = updated.enabled
        ? 'Hunter activated'
        : 'Hunter paused'

      setStatus(message)
      showToast(message)
    } catch (error) {
      setHunters(previousHunters)

      if (selectedId === id) {
        setDraft(previousDraft)
      }

      const message =
        error instanceof Error
          ? error.message
          : 'Unable to update Hunter status'

      setStatus(message)
      showToast(message, 'error')
    }
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
      setPendingSelectionId(null)
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

      {pendingSelectionId && (
        <div
          aria-labelledby="unsaved-changes-title"
          aria-modal="true"
          className="seekrModalBackdrop"
          role="dialog"
        >
          <div className="seekrModal">
            <div className="seekrModalIcon">!</div>

            <div className="seekrModalContent">
              <span className="seekrModalEyebrow">UNSAVED CHANGES</span>

              <h3 id="unsaved-changes-title">
                Leave this Hunter without saving?
              </h3>

              <p>
                Your latest edits have not been saved. You can keep editing or
                discard those changes and open the other Hunter.
              </p>
            </div>

            <div className="seekrModalActions">
              <button
                className="seekrModalSecondary"
                onClick={keepEditing}
                type="button"
              >
                Keep Editing
              </button>

              <button
                className="seekrModalDanger"
                onClick={() => void discardUnsavedChanges()}
                type="button"
              >
                Discard Changes
              </button>
            </div>
          </div>
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
          <HunterListPanel
            dragOverHunterId={dragOverHunterId}
            draggedHunterId={draggedHunterId}
            hunters={hunters}
            onCreate={() => void createNewHunter()}
            onDragEnd={cancelHunterDrag}
            onDragStart={beginHunterDrag}
            onDrop={(id) => void finishHunterDrop(id)}
            onDuplicate={(id) => void duplicateHunter(id)}
            onMoveOver={moveHunterOver}
            onRemove={(id) => void removeHunter(id)}
            onSelect={(id) => void selectHunter(id)}
            onToggleEnabled={(id) => void toggleHunterEnabled(id)}
            selectedId={selectedId}
          />

          <HunterEditor
            categoryOptions={CATEGORY_OPTIONS}
            draft={draft}
            hasUnsavedChanges={hasUnsavedChanges}
            marketplaceOptions={MARKETPLACE_OPTIONS}
            onAllCategoriesChange={updateAllCategories}
            onAllMarketplacesChange={updateAllMarketplaces}
            onCategoryChange={updateCategory}
            onEnabledChange={updateEnabled}
            onMarketplaceChange={updateMarketplace}
            onNameChange={updateName}
            onPostalCodeChange={updatePostalCode}
            onRadiusChange={updateRadius}
            onSave={saveHunter}
            onThresholdChange={updateThreshold}
          />
        </section>
      </div>
    </main>
  )
}
