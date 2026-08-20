import { LocalStorageHunterRepository } from './localStorageHunterRepository'
import type { Hunter } from '../../domain/hunters/Hunter'

const storage = new Map<string, string>()

Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem(key: string) {
      return storage.get(key) ?? null
    },
    setItem(key: string, value: string) {
      storage.set(key, value)
    },
    removeItem(key: string) {
      storage.delete(key)
    },
    clear() {
      storage.clear()
    },
  },
})

const hunter: Hunter = {
  id: 'round-trip-test',
  name: 'My Exact Hunter',
  enabled: false,
  location: {
    postalCode: '33578',
    radiusMiles: 73,
  },
  categories: ['vehicles', 'custom-category'],
  sources: ['facebook_marketplace', 'custom-source'],
  thresholds: {
    minimumSpend: 123,
    maximumSpend: 4567,
    minimumExpectedProfit: 891,
    minimumRoiPercent: 37.5,
    minimumSeekrScore: null,
  },
}

const repository = new LocalStorageHunterRepository()

await repository.save(hunter)

const loaded = await repository.getById(hunter.id)

if (JSON.stringify(loaded) !== JSON.stringify(hunter)) {
  console.error('ROUND TRIP FAILED')
  console.error({ hunter, loaded })
  throw new Error('Hunter persistence round trip failed')
} else {
  console.log('ROUND TRIP PASSED')
  console.log(JSON.stringify(loaded, null, 2))
}
