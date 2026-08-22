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
import type { HunterIntelligencePort } from '../../application/hunters/hunterIntelligencePort'

const MARKETPLACE_OPTIONS: MarketplaceSource[] = [
  'facebook_marketplace',
  'craigslist',
]

const CATEGORY_OPTIONS: HunterCategory[] = [
  'vehicles',
  'electronics',
  'tools',
  'appliances',
  'furniture',
  'collectibles',
  'other',
]

const INITIAL_HUNTER_ID = 'hunter-default'

export function useHunterWorkspace(
  service: HunterService,
  intelligence: HunterIntelligencePort,
) {
const [hunters, setHunters] = useState<Hunter[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Hunter | null>(null)
  const [status, setStatus] = useState('Loading Hunters...')
  const [isEvaluating, setIsEvaluating] = useState(false)
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
            ? addHunterSource(updatedHunter, marketplace)
            : removeHunterSource(updatedHunter, marketplace),
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
            ? addHunterCategory(updatedHunter, category)
            : removeHunterCategory(updatedHunter, category),
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

  async function runHunterIntelligence() {
    if (!draft || isEvaluating) {
      return
    }

    if (hasUnsavedChanges) {
      const message = 'Save this Hunter before running intelligence'
      setStatus(message)
      showToast(message, 'error')
      return
    }

    setIsEvaluating(true)
    setStatus(`Analyzing ${draft.name || 'Hunter'}...`)

    try {
      const result = await intelligence.evaluateHunter(draft)

      if (result.planningErrors.length > 0) {
        const message = result.planningErrors.join(' ')
        setStatus(message)
        showToast(message, 'error')
        return
      }

      const listingCount = result.listings.length
      const message =
        listingCount === 1
          ? '1 opportunity analyzed'
          : `${listingCount} opportunities analyzed`

      setStatus(message)
      showToast(message)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to run Hunter intelligence'

      setStatus(message)
      showToast(message, 'error')
    } finally {
      setIsEvaluating(false)
    }
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


  return {
    hunters,
    selectedId,
    draft,
    status,
    draggedHunterId,
    dragOverHunterId,
    pendingSelectionId,
    toast,
    hasUnsavedChanges,
    isEvaluating,
    selectHunter,
    discardUnsavedChanges,
    keepEditing,
    createNewHunter,
    duplicateHunter,
    removeHunter,
    beginHunterDrag,
    moveHunterOver,
    finishHunterDrop,
    cancelHunterDrag,
    toggleHunterEnabled,
    updateName,
    updateEnabled,
    updatePostalCode,
    updateRadius,
    updateMarketplace,
    updateAllMarketplaces,
    updateCategory,
    updateAllCategories,
    updateThreshold,
    runHunterIntelligence,
    saveHunter,
  }
}
