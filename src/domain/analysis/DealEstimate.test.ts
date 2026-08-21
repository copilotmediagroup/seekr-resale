import {
  inspectDealEstimateCompleteness,
  type DealEstimateSet,
} from './DealEstimate'

const completeEstimates: DealEstimateSet = {
  estimatedResaleValue: {
    amount: 7500,
    confidence: 'high',
    origin: 'provider',
    basis: 'Comparable-market valuation.',
  },
  expectedPurchasePrice: {
    amount: 4000,
    confidence: 'medium',
    origin: 'automated',
    basis: 'Expected negotiated purchase price.',
  },
  estimatedRepairCost: {
    amount: 500,
    confidence: 'medium',
    origin: 'automated',
    basis: 'Observed-condition repair estimate.',
  },
  estimatedTransportCost: {
    amount: 100,
    confidence: 'high',
    origin: 'provider',
    basis: 'Transport quote.',
  },
  estimatedTaxesAndRegistration: {
    amount: 250,
    confidence: 'high',
    origin: 'provider',
    basis: 'Applicable taxes and registration estimate.',
  },
  estimatedTransactionFees: {
    amount: 50,
    confidence: 'high',
    origin: 'provider',
    basis: 'Marketplace transaction fee estimate.',
  },
  estimatedOtherCosts: {
    amount: 100,
    confidence: 'medium',
    origin: 'user',
    basis: 'User-supplied miscellaneous cost allowance.',
  },
}

const complete =
  inspectDealEstimateCompleteness(completeEstimates)

if (!complete.complete) {
  throw new Error(
    `Expected complete estimates, missing: ${complete.missing.join(', ')}`,
  )
}

if (complete.missing.length !== 0) {
  throw new Error(
    'Complete estimate set unexpectedly reported missing fields',
  )
}

const incompleteEstimates: DealEstimateSet = {
  ...completeEstimates,
  estimatedRepairCost: null,
  estimatedTransportCost: null,
}

const incomplete =
  inspectDealEstimateCompleteness(incompleteEstimates)

if (incomplete.complete) {
  throw new Error(
    'Incomplete estimate set was incorrectly marked complete',
  )
}

if (
  !incomplete.missing.includes('estimatedRepairCost') ||
  !incomplete.missing.includes('estimatedTransportCost')
) {
  throw new Error(
    `Missing estimate fields were not preserved: ${incomplete.missing.join(', ')}`,
  )
}

const userOverride: DealEstimateSet = {
  ...completeEstimates,
  expectedPurchasePrice: {
    amount: 3600,
    confidence: 'high',
    origin: 'user',
    basis: 'User entered negotiated purchase price.',
  },
}

if (
  userOverride.expectedPurchasePrice?.origin !== 'user'
) {
  throw new Error(
    'User-origin estimate was not preserved',
  )
}

if (
  userOverride.expectedPurchasePrice.amount !== 3600
) {
  throw new Error(
    'User-entered estimate amount was not preserved',
  )
}

console.log('DEAL ESTIMATION CONTRACT TESTS PASSED')
