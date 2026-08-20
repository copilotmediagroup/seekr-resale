import { useEffect, useState } from 'react'
import type { Hunter } from '../../domain/hunters/Hunter'
import type { HunterService } from '../../application/hunters/hunterService'

interface HunterWorkspaceProps {
  service: HunterService
}

export function HunterWorkspace({ service }: HunterWorkspaceProps) {
  const [hunters, setHunters] = useState<Hunter[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Hunter | null>(null)
  const [status, setStatus] = useState('Loading Hunters...')

  useEffect(() => {
    let active = true

    async function load() {
      const loaded = await service.listHunters()

      if (!active) {
        return
      }

      setHunters(loaded)

      if (loaded.length === 0) {
        setSelectedId(null)
        setDraft(null)
        setStatus('No Hunters yet')
        return
      }

      setSelectedId(loaded[0].id)
      setDraft(loaded[0])
      setStatus(`${loaded.length} Hunter${loaded.length === 1 ? '' : 's'} loaded`)
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
      current
        ? {
            ...current,
            name,
          }
        : current,
    )
  }

  function updateEnabled(enabled: boolean) {
    setDraft((current) =>
      current
        ? {
            ...current,
            enabled,
          }
        : current,
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

  function updateRadius(radius: string) {
    setDraft((current) => {
      if (!current) {
        return current
      }

      const trimmed = radius.trim()
      const radiusMiles = trimmed === '' ? null : Number(trimmed)

      return {
        ...current,
        location: {
          ...current.location,
          radiusMiles,
        },
      }
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
      setHunters(refreshed)

      const saved = refreshed.find((hunter) => hunter.id === draft.id) ?? draft
      setDraft(saved)
      setSelectedId(saved.id)
      setStatus('Saved')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to save Hunter')
    }
  }

  return (
    <main className="workspace">
      <header className="topbar">
        <div>
          <div className="brand">SEEKR</div>
          <h1>Hunters</h1>
        </div>

        <div className="workspaceStatus">{status}</div>
      </header>

      <section className="workspaceGrid">
        <aside className="hunterList">
          <div className="sectionLabel">YOUR HUNTERS</div>

          {hunters.length === 0 ? (
            <div className="emptyState">
              Create your first Hunter to start defining what SEEKR should look for.
            </div>
          ) : (
            hunters.map((hunter) => (
              <button
                className={`hunterCard ${
                  selectedId === hunter.id ? 'hunterCardActive' : ''
                }`}
                key={hunter.id}
                onClick={() => void selectHunter(hunter.id)}
                type="button"
              >
                <div>
                  <strong>{hunter.name}</strong>
                  <span>
                    {hunter.location.postalCode || 'No ZIP'}
                    {hunter.location.radiusMiles === null
                      ? ' · Any radius'
                      : ` · ${hunter.location.radiusMiles} mi`}
                  </span>
                </div>

                <span
                  className={`hunterState ${
                    hunter.enabled ? 'hunterStateEnabled' : ''
                  }`}
                >
                  {hunter.enabled ? 'ON' : 'OFF'}
                </span>
              </button>
            ))
          )}
        </aside>

        <section className="hunterEditor">
          {!draft ? (
            <div className="editorPlaceholder">
              <span>Hunter configuration</span>
              <h2>No Hunter selected</h2>
              <p>
                Hunter controls will appear here after a Hunter exists in persistence.
              </p>
            </div>
          ) : (
            <>
              <div className="editorHeading">
                <div>
                  <span>Hunter configuration</span>
                  <h2>{draft.name || 'Untitled Hunter'}</h2>
                  <p>
                    Define where this Hunter searches. These settings belong to you and
                    can be changed at any time.
                  </p>
                </div>

                <label className="enabledControl">
                  <span>Hunter enabled</span>
                  <input
                    checked={draft.enabled}
                    onChange={(event) => updateEnabled(event.target.checked)}
                    type="checkbox"
                  />
                </label>
              </div>

              <div className="configurationPanel">
                <div className="fieldGroup fieldGroupWide">
                  <label htmlFor="hunter-name">Hunter name</label>
                  <input
                    id="hunter-name"
                    onChange={(event) => updateName(event.target.value)}
                    placeholder="My Hunter"
                    type="text"
                    value={draft.name}
                  />
                </div>

                <div className="fieldGroup">
                  <label htmlFor="hunter-postal-code">ZIP code</label>
                  <input
                    id="hunter-postal-code"
                    inputMode="numeric"
                    onChange={(event) => updatePostalCode(event.target.value)}
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
                      onChange={(event) => updateRadius(event.target.value)}
                      placeholder="Any"
                      type="number"
                      value={draft.location.radiusMiles ?? ''}
                    />
                    <span>miles</span>
                  </div>
                </div>
              </div>

              <div className="editorActions">
                <span>
                  Blank radius means SEEKR will not impose a radius preference.
                </span>

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
    </main>
  )
}
