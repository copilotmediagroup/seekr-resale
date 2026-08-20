import { useEffect, useMemo, useState } from 'react'
import { HunterService } from '../../application/hunters/hunterService'
import { createHunter } from '../../domain/hunters/createHunter'
import type { Hunter } from '../../domain/hunters/Hunter'
import { LocalStorageHunterRepository } from '../../infrastructure/hunters/localStorageHunterRepository'

const createHunterId = (): string => {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID()
  }

  return `hunter-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function HunterWorkspace() {
  const service = useMemo(
    () => new HunterService(new LocalStorageHunterRepository()),
    [],
  )

  const [hunter, setHunter] = useState<Hunter | null>(null)
  const [status, setStatus] = useState('Loading Hunter...')

  useEffect(() => {
    let active = true

    const loadHunter = async () => {
      try {
        const hunters = await service.listHunters()

        if (!active) {
          return
        }

        if (hunters.length > 0) {
          setHunter(hunters[0])
          setStatus('Hunter loaded from local persistence.')
          return
        }

        const newHunter = createHunter({
          id: createHunterId(),
        })

        await service.saveHunter(newHunter)

        if (!active) {
          return
        }

        setHunter(newHunter)
        setStatus('Your first Hunter is ready.')
      } catch (error) {
        if (!active) {
          return
        }

        setStatus(
          error instanceof Error
            ? error.message
            : 'Unable to load Hunter.',
        )
      }
    }

    void loadHunter()

    return () => {
      active = false
    }
  }, [service])

  return (
    <main className="app">
      <section className="hunterWorkspace">
        <header className="workspaceHeader">
          <div>
            <div className="brand">SEEKR</div>
            <p className="eyebrow">HUNTER CONFIGURATION</p>
            <h1>
              {hunter?.name ?? 'Preparing your Hunter'}
            </h1>
            <p className="workspaceIntro">
              Define exactly what SEEKR should look for. Your strategy stays
              under your control.
            </p>
          </div>

          <div
            className={`hunterState ${
              hunter?.enabled ? 'hunterStateEnabled' : ''
            }`}
          >
            <span className="statusDot" />
            {hunter
              ? hunter.enabled
                ? 'Enabled'
                : 'Disabled'
              : 'Loading'}
          </div>
        </header>

        <section className="hunterFoundationCard">
          <div>
            <p className="cardLabel">FOUNDATION CONNECTED</p>
            <h2>Real Hunter persistence is online.</h2>
            <p>
              This workspace is connected through the Hunter application
              service and repository. The next slice will add the actual
              configuration controls here.
            </p>
          </div>

          <div className="hunterIdentity">
            <span>Hunter ID</span>
            <strong>{hunter?.id ?? '—'}</strong>
          </div>
        </section>

        <p className="workspaceStatus">{status}</p>
      </section>
    </main>
  )
}
