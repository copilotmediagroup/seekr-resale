import { createHunterRuntime } from './createHunterRuntime'

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>()

  get length(): number {
    return this.values.size
  }

  clear(): void {
    this.values.clear()
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  key(index: number): string | null {
    return Array.from(this.values.keys())[index] ?? null
  }

  removeItem(key: string): void {
    this.values.delete(key)
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }
}

Object.defineProperty(
  globalThis,
  'localStorage',
  {
    configurable: true,
    value: new MemoryStorage(),
  },
)

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
    '===== SCENARIO 1 — ECONOMICS PORT SAVES USER VALUES =====',
  )

  const runtime = createHunterRuntime()

  await runtime.economics.saveListingEconomics(
    'facebook_marketplace:test-economics-001',
    {
      estimatedRepairCost: 300,
      estimatedTransportCost: 100,
      estimatedTaxesAndRegistration: 250,
      estimatedTransactionFees: 50,
      estimatedOtherCosts: 100,
    },
  )

  const stored =
    await runtime.economics.getListingEconomics(
      'facebook_marketplace:test-economics-001',
    )

  assert(
    stored.estimatedRepairCost === 300,
    'Repair cost did not persist.',
  )

  assert(
    stored.estimatedTransportCost === 100,
    'Transport cost did not persist.',
  )

  assert(
    stored.estimatedTaxesAndRegistration ===
      250,
    'Taxes and registration did not persist.',
  )

  assert(
    stored.estimatedTransactionFees === 50,
    'Transaction fees did not persist.',
  )

  assert(
    stored.estimatedOtherCosts === 100,
    'Other costs did not persist.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 2 — PERSISTED VALUES RETAIN USER ORIGIN =====',
  )

  const raw =
    await runtime.listingEconomics.getByListingId(
      'facebook_marketplace:test-economics-001',
    )

  assert(
    raw.estimatedRepairCost?.origin === 'user',
    'Saved economics did not retain user origin.',
  )

  assert(
    raw.estimatedRepairCost?.confidence ===
      'high',
    'User economics confidence was not preserved.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 3 — CLEAR REMOVES LISTING ECONOMICS =====',
  )

  await runtime.economics.clearListingEconomics(
    'facebook_marketplace:test-economics-001',
  )

  const cleared =
    await runtime.economics.getListingEconomics(
      'facebook_marketplace:test-economics-001',
    )

  assert(
    Object.keys(cleared).length === 0,
    'Listing economics were not cleared.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== SCENARIO 4 — EDITABLE ECONOMICS PRESERVE RESALE OVERRIDE =====',
  )

  await runtime.listingEconomics.save(
    'facebook_marketplace:test-preserve-001',
    {
      estimatedResaleValue: {
        amount: 5100,
        confidence: 'high',
        origin: 'user',
        basis: 'Existing resale override.',
      },
    },
  )

  await runtime.economics.saveListingEconomics(
    'facebook_marketplace:test-preserve-001',
    {
      expectedPurchasePrice: 2900,
      estimatedRepairCost: 200,
    },
  )

  const preserved =
    await runtime.listingEconomics.getByListingId(
      'facebook_marketplace:test-preserve-001',
    )

  assert(
    preserved.estimatedResaleValue?.amount ===
      5100,
    'Existing resale override was not preserved.',
  )

  assert(
    preserved.expectedPurchasePrice?.amount ===
      2900,
    'Expected purchase price was not saved.',
  )

  console.log('PASS')
  console.log()

  console.log(
    '===== LISTING ECONOMICS APPLICATION PORT PASSED =====',
  )
}

void main()
