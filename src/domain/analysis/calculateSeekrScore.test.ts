import { calculateSeekrScore } from './calculateSeekrScore'
import type { SeekrScoreInput } from './SeekrScore'

const assertEqual = (
  actual: number,
  expected: number,
  label: string,
): void => {
  if (actual !== expected) {
    throw new Error(
      `${label}: expected ${expected}, received ${actual}`,
    )
  }
}

const getComponentScore = (
  input: SeekrScoreInput,
  key:
    | 'profitPotential'
    | 'roiStrength'
    | 'acquisitionDiscount'
    | 'listingOpportunity',
): number => {
  const score = calculateSeekrScore(input)
  const component = score.components.find(
    (candidate) => candidate.key === key,
  )

  if (!component) {
    throw new Error(`Missing score component: ${key}`)
  }

  return component.score
}

console.log('===== SCENARIO 1 — STRONG DEAL =====')

const strongDeal: SeekrScoreInput = {
  askingPrice: 5000,
  expectedPurchasePrice: 3750,
  estimatedResaleValue: 8000,
  totalAcquisitionCost: 4500,
  estimatedProfit: 3500,
  roiPercent: 77.78,
  listingAgeDays: 30,
}

const strongScore = calculateSeekrScore(strongDeal)

assertEqual(strongScore.total, 100, 'Strong deal total')
assertEqual(
  getComponentScore(strongDeal, 'profitPotential'),
  30,
  'Strong profit',
)
assertEqual(
  getComponentScore(strongDeal, 'roiStrength'),
  30,
  'Strong ROI',
)
assertEqual(
  getComponentScore(strongDeal, 'acquisitionDiscount'),
  20,
  'Strong discount',
)
assertEqual(
  getComponentScore(strongDeal, 'listingOpportunity'),
  20,
  'Strong listing age',
)

console.log('PASS')
console.log(strongScore)

console.log()
console.log('===== SCENARIO 2 — WEAK ECONOMICS =====')

const weakDeal: SeekrScoreInput = {
  askingPrice: 3000,
  expectedPurchasePrice: 3000,
  estimatedResaleValue: 3200,
  totalAcquisitionCost: 3200,
  estimatedProfit: 0,
  roiPercent: 0,
  listingAgeDays: 1,
}

const weakScore = calculateSeekrScore(weakDeal)

assertEqual(weakScore.total, 2, 'Weak deal total')
assertEqual(
  getComponentScore(weakDeal, 'profitPotential'),
  0,
  'Weak profit',
)
assertEqual(
  getComponentScore(weakDeal, 'roiStrength'),
  0,
  'Weak ROI',
)
assertEqual(
  getComponentScore(weakDeal, 'acquisitionDiscount'),
  0,
  'Weak discount',
)
assertEqual(
  getComponentScore(weakDeal, 'listingOpportunity'),
  2,
  'Fresh listing opportunity',
)

console.log('PASS')
console.log(weakScore)

console.log()
console.log(
  '===== SCENARIO 3 — OLD LISTING CANNOT RESCUE BAD ECONOMICS =====',
)

const oldBadDeal: SeekrScoreInput = {
  askingPrice: 4000,
  expectedPurchasePrice: 4000,
  estimatedResaleValue: 3500,
  totalAcquisitionCost: 4500,
  estimatedProfit: -1000,
  roiPercent: -22.22,
  listingAgeDays: 45,
}

const oldBadScore = calculateSeekrScore(oldBadDeal)

assertEqual(oldBadScore.total, 20, 'Old bad deal total')
assertEqual(
  getComponentScore(oldBadDeal, 'listingOpportunity'),
  20,
  'Old listing opportunity',
)
assertEqual(
  getComponentScore(oldBadDeal, 'profitPotential'),
  0,
  'Old bad profit',
)
assertEqual(
  getComponentScore(oldBadDeal, 'roiStrength'),
  0,
  'Old bad ROI',
)

console.log('PASS')
console.log(oldBadScore)

console.log()
console.log(
  '===== SCENARIO 4 — FRESH LISTING WITH GREAT ECONOMICS =====',
)

const freshGreatDeal: SeekrScoreInput = {
  askingPrice: 5000,
  expectedPurchasePrice: 3750,
  estimatedResaleValue: 8000,
  totalAcquisitionCost: 4500,
  estimatedProfit: 3500,
  roiPercent: 77.78,
  listingAgeDays: 0,
}

const freshGreatScore = calculateSeekrScore(freshGreatDeal)

assertEqual(
  freshGreatScore.total,
  82,
  'Fresh great deal total',
)
assertEqual(
  getComponentScore(freshGreatDeal, 'listingOpportunity'),
  2,
  'Fresh great listing opportunity',
)

console.log('PASS')
console.log(freshGreatScore)

console.log()
console.log('===== SCENARIO 5 — UNKNOWN LISTING AGE =====')

const unknownAgeDeal: SeekrScoreInput = {
  askingPrice: 5000,
  expectedPurchasePrice: 3750,
  estimatedResaleValue: 8000,
  totalAcquisitionCost: 4500,
  estimatedProfit: 3500,
  roiPercent: 77.78,
  listingAgeDays: null,
}

const unknownAgeScore = calculateSeekrScore(unknownAgeDeal)

assertEqual(
  unknownAgeScore.total,
  80,
  'Unknown-age total',
)
assertEqual(
  getComponentScore(unknownAgeDeal, 'listingOpportunity'),
  0,
  'Unknown-age listing opportunity',
)

console.log('PASS')
console.log(unknownAgeScore)

console.log()
console.log('===== SCENARIO 6 — NO NEGOTIATION DISCOUNT =====')

const noDiscountDeal: SeekrScoreInput = {
  askingPrice: 5000,
  expectedPurchasePrice: 5000,
  estimatedResaleValue: 8500,
  totalAcquisitionCost: 5500,
  estimatedProfit: 3000,
  roiPercent: 54.55,
  listingAgeDays: 14,
}

const noDiscountScore = calculateSeekrScore(noDiscountDeal)

assertEqual(
  getComponentScore(noDiscountDeal, 'acquisitionDiscount'),
  0,
  'No-discount acquisition score',
)
assertEqual(
  noDiscountScore.total,
  78,
  'No-discount total',
)

console.log('PASS')
console.log(noDiscountScore)

console.log()
console.log('===== SCENARIO 7 — SCORE FLOOR =====')

const floorDeal: SeekrScoreInput = {
  askingPrice: 0,
  expectedPurchasePrice: 0,
  estimatedResaleValue: 0,
  totalAcquisitionCost: 0,
  estimatedProfit: -5000,
  roiPercent: -100,
  listingAgeDays: null,
}

const floorScore = calculateSeekrScore(floorDeal)

assertEqual(floorScore.total, 0, 'Score floor')

console.log('PASS')
console.log(floorScore)

console.log()
console.log('===== SCENARIO 8 — SCORE CEILING =====')

const ceilingDeal: SeekrScoreInput = {
  askingPrice: 10000,
  expectedPurchasePrice: 5000,
  estimatedResaleValue: 30000,
  totalAcquisitionCost: 7000,
  estimatedProfit: 23000,
  roiPercent: 328.57,
  listingAgeDays: 365,
}

const ceilingScore = calculateSeekrScore(ceilingDeal)

assertEqual(ceilingScore.total, 100, 'Score ceiling')

for (const component of ceilingScore.components) {
  if (
    component.score < 0 ||
    component.score > component.maximumScore
  ) {
    throw new Error(
      `Component ${component.key} escaped its score bounds`,
    )
  }
}

console.log('PASS')
console.log(ceilingScore)

console.log()
console.log('===== ALL SEEKR SCORE SCENARIOS PASSED =====')
