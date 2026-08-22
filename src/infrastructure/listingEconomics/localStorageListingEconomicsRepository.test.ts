import { LocalStorageListingEconomicsRepository } from './localStorageListingEconomicsRepository'

const storage = new Map<string, string>()

Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem(key: string): string | null {
      return storage.get(key) ?? null
    },

    setItem(key: string, value: string): void {
      storage.set(key, value)
    },

    removeItem(key: string): void {
      storage.delete(key)
    },

    clear(): void {
      storage.clear()
    },
  },
  configurable: true,
})

const assert = (
  condition: boolean,
  message: string,
): void => {
  if (!condition) {
    throw new Error(message)
  }
}

const main = async (): Promise<void> => {
  console.log(
    '===== SCENARIO 1 — EMPTY REPOSITORY RETURNS NO OVERRIDES =====',
  )

  localStorage.clear()

  const repository =
    new LocalStorageListingEconomicsRepository()

  const empty =
    await repository.getByListingId(
      'facebook_marketplace:listing-001',
    )

  assert(
    Object.keys(empty).length === 0,
    'Unknown listing must return empty overrides.',
  )

  console.log('PASS')

  console.log(
    '===== SCENARIO 2 — LISTING ECONOMICS ROUND TRIP =====',
  )

  await repository.save(
    'facebook_marketplace:listing-001',
    {
      estimatedTransportCost: {
        amount: 0,
        confidence: 'high',
        origin: 'user',
        basis: 'User has free transport.',
      },
      estimatedRepairCost: {
        amount: 450,
        confidence: 'high',
        origin: 'user',
        basis: 'User-entered repair estimate.',
      },
    },
  )

  const loaded =
    await repository.getByListingId(
      'facebook_marketplace:listing-001',
    )

  assert(
    loaded.estimatedTransportCost?.amount === 0,
    'Explicit zero transport cost was not persisted.',
  )

  assert(
    loaded.estimatedRepairCost?.amount === 450,
    'Repair override was not persisted.',
  )

  console.log('PASS')

  console.log(
    '===== SCENARIO 3 — LISTINGS REMAIN ISOLATED =====',
  )

  await repository.save(
    'craigslist:listing-002',
    {
      estimatedOtherCosts: {
        amount: 125,
        confidence: 'medium',
        origin: 'user',
        basis: 'User-entered other costs.',
      },
    },
  )

  const first =
    await repository.getByListingId(
      'facebook_marketplace:listing-001',
    )

  const second =
    await repository.getByListingId(
      'craigslist:listing-002',
    )

  assert(
    first.estimatedOtherCosts === undefined,
    'Economics leaked between listing identities.',
  )

  assert(
    second.estimatedOtherCosts?.amount === 125,
    'Second listing economics were not isolated.',
  )

  console.log('PASS')

  console.log(
    '===== SCENARIO 4 — SAVE REPLACES LISTING OVERRIDE SET =====',
  )

  await repository.save(
    'facebook_marketplace:listing-001',
    {
      estimatedOtherCosts: {
        amount: 75,
        confidence: 'high',
        origin: 'user',
        basis: 'Replacement override set.',
      },
    },
  )

  const replaced =
    await repository.getByListingId(
      'facebook_marketplace:listing-001',
    )

  assert(
    replaced.estimatedOtherCosts?.amount === 75,
    'Replacement override was not saved.',
  )

  assert(
    replaced.estimatedRepairCost === undefined,
    'Save must replace the listing override set rather than silently merge stale values.',
  )

  console.log('PASS')

  console.log(
    '===== SCENARIO 5 — DELETE REMOVES ONLY TARGET LISTING =====',
  )

  await repository.delete(
    'facebook_marketplace:listing-001',
  )

  const deleted =
    await repository.getByListingId(
      'facebook_marketplace:listing-001',
    )

  const preserved =
    await repository.getByListingId(
      'craigslist:listing-002',
    )

  assert(
    Object.keys(deleted).length === 0,
    'Deleted listing economics still exist.',
  )

  assert(
    preserved.estimatedOtherCosts?.amount === 125,
    'Deleting one listing removed another listing.',
  )

  console.log('PASS')

  console.log(
    '===== ALL LISTING ECONOMICS PERSISTENCE SCENARIOS PASSED =====',
  )
}

void main()
