import type { DealAnalysis } from './DealAnalysis'
import { qualifyDealForHunter } from './qualifyDealForHunter'
import type { Hunter } from '../hunters/Hunter'

const createTestHunter = (): Hunter => ({
  id: 'hunter-qualification-test',
  name: 'Qualification Test Hunter',
  enabled: true,
  location: {
    postalCode: '33578',
    radiusMiles: 50,
  },
  categories: ['vehicles'],
  sources: ['facebook_marketplace'],
  thresholds: {
    minimumSpend: 2000,
    maximumSpend: 5000,
    minimumExpectedProfit: 1500,
    minimumRoiPercent: 30,
    minimumSeekrScore: 70,
  },
})

const createAnalysis = (): DealAnalysis => ({
  listingId: 'listing-1',
  status: 'analyzed',
  valuation: {
    estimatedResaleValue: 7000,
  },
  acquisitionCosts: {
    askingPrice: 4000,
    expectedPurchasePrice: 3500,
    estimatedRepairCost: 300,
    estimatedTransportCost: 100,
    estimatedTaxesAndRegistration: 200,
    estimatedTransactionFees: 0,
    estimatedOtherCosts: 0,
    totalAcquisitionCost: 4100,
  },
  economics: {
    askingPrice: 4000,
    expectedPurchasePrice: 3500,
    estimatedResaleValue: 7000,
    totalAcquisitionCost: 4100,
    estimatedProfit: 2900,
    roiPercent: (2900 / 4100) * 100,
  },
  seekrScore: 82,
})

const qualified = qualifyDealForHunter(
  createTestHunter(),
  createAnalysis(),
)

if (qualified.status !== 'qualified') {
  throw new Error(
    `Expected qualified deal, received ${qualified.status}`,
  )
}

if (qualified.failures.length !== 0 || qualified.pending.length !== 0) {
  throw new Error('Qualified deal unexpectedly contains issues')
}

const failingAnalysis = createAnalysis()
failingAnalysis.economics = {
  ...failingAnalysis.economics!,
  expectedPurchasePrice: 5500,
  estimatedProfit: 900,
  roiPercent: 15,
}
failingAnalysis.seekrScore = 60

const rejected = qualifyDealForHunter(
  createTestHunter(),
  failingAnalysis,
)

if (rejected.status !== 'rejected') {
  throw new Error(
    `Expected rejected deal, received ${rejected.status}`,
  )
}

const rejectedCriteria = rejected.failures.map(
  (failure) => failure.criterion,
)

for (const expectedCriterion of [
  'maximumSpend',
  'minimumExpectedProfit',
  'minimumRoiPercent',
  'minimumSeekrScore',
] as const) {
  if (!rejectedCriteria.includes(expectedCriterion)) {
    throw new Error(
      `Missing rejection criterion: ${expectedCriterion}`,
    )
  }
}

const pendingAnalysis = createAnalysis()
pendingAnalysis.status = 'pending_valuation'
pendingAnalysis.valuation = null
pendingAnalysis.acquisitionCosts = null
pendingAnalysis.economics = null
pendingAnalysis.seekrScore = null

const pending = qualifyDealForHunter(
  createTestHunter(),
  pendingAnalysis,
)

if (pending.status !== 'pending') {
  throw new Error(
    `Expected pending deal, received ${pending.status}`,
  )
}

if (pending.pending.length !== 5) {
  throw new Error(
    `Expected 5 pending criteria, received ${pending.pending.length}`,
  )
}

const unrestrictedHunter = createTestHunter()
unrestrictedHunter.thresholds = {
  minimumSpend: null,
  maximumSpend: null,
  minimumExpectedProfit: null,
  minimumRoiPercent: null,
  minimumSeekrScore: null,
}

const unrestricted = qualifyDealForHunter(
  unrestrictedHunter,
  pendingAnalysis,
)

if (unrestricted.status !== 'qualified') {
  throw new Error(
    `Expected unrestricted Hunter to qualify, received ${unrestricted.status}`,
  )
}

if (
  unrestricted.failures.length !== 0 ||
  unrestricted.pending.length !== 0
) {
  throw new Error(
    'Unrestricted Hunter must not invent qualification requirements',
  )
}

const minimumSpendFailureAnalysis = createAnalysis()
minimumSpendFailureAnalysis.economics = {
  ...minimumSpendFailureAnalysis.economics!,
  expectedPurchasePrice: 1500,
}

const minimumSpendFailure = qualifyDealForHunter(
  createTestHunter(),
  minimumSpendFailureAnalysis,
)

if (
  !minimumSpendFailure.failures.some(
    (failure) => failure.criterion === 'minimumSpend',
  )
) {
  throw new Error('Minimum spend threshold was not enforced')
}

console.log('HUNTER QUALIFICATION TESTS PASSED')
