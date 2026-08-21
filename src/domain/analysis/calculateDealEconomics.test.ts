import {
  calculateAcquisitionCosts,
  calculateDealEconomics,
} from './calculateDealEconomics'

function assertEqual(
  actual: number,
  expected: number,
  label: string,
): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: expected ${expected}, received ${actual}`,
    )
  }
}

function assertClose(
  actual: number,
  expected: number,
  label: string,
): void {
  const tolerance = 0.000001

  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(
      `${label}: expected ${expected}, received ${actual}`,
    )
  }
}

console.log('===== SCENARIO 1 — PROFITABLE DEAL =====')

const profitableCosts = calculateAcquisitionCosts({
  askingPrice: 5000,
  expectedPurchasePrice: 4200,
  estimatedRepairCost: 300,
  estimatedTransportCost: 100,
  estimatedTaxesAndRegistration: 250,
  estimatedTransactionFees: 50,
  estimatedOtherCosts: 100,
})

const profitableDeal = calculateDealEconomics({
  acquisitionCosts: profitableCosts,
  estimatedResaleValue: 6500,
})

assertEqual(
  profitableCosts.totalAcquisitionCost,
  5000,
  'Profitable total acquisition cost',
)

assertEqual(
  profitableDeal.estimatedProfit,
  1500,
  'Profitable estimated profit',
)

assertClose(
  profitableDeal.roiPercent,
  30,
  'Profitable ROI',
)

console.log('PASS')
console.log(profitableDeal)

console.log()
console.log('===== SCENARIO 2 — LOSING DEAL =====')

const losingCosts = calculateAcquisitionCosts({
  askingPrice: 4000,
  expectedPurchasePrice: 3800,
  estimatedRepairCost: 1000,
  estimatedTransportCost: 200,
  estimatedTaxesAndRegistration: 300,
  estimatedTransactionFees: 100,
  estimatedOtherCosts: 100,
})

const losingDeal = calculateDealEconomics({
  acquisitionCosts: losingCosts,
  estimatedResaleValue: 5000,
})

assertEqual(
  losingCosts.totalAcquisitionCost,
  5500,
  'Losing total acquisition cost',
)

assertEqual(
  losingDeal.estimatedProfit,
  -500,
  'Losing estimated profit',
)

assertClose(
  losingDeal.roiPercent,
  (-500 / 5500) * 100,
  'Losing ROI',
)

console.log('PASS')
console.log(losingDeal)

console.log()
console.log('===== SCENARIO 3 — NEGOTIATION BELOW ASK =====')

const negotiatedCosts = calculateAcquisitionCosts({
  askingPrice: 6000,
  expectedPurchasePrice: 4500,
  estimatedRepairCost: 0,
  estimatedTransportCost: 0,
  estimatedTaxesAndRegistration: 0,
  estimatedTransactionFees: 0,
  estimatedOtherCosts: 0,
})

const negotiatedDeal = calculateDealEconomics({
  acquisitionCosts: negotiatedCosts,
  estimatedResaleValue: 6000,
})

assertEqual(
  negotiatedDeal.askingPrice,
  6000,
  'Negotiated asking price',
)

assertEqual(
  negotiatedDeal.expectedPurchasePrice,
  4500,
  'Negotiated expected purchase price',
)

assertEqual(
  negotiatedDeal.totalAcquisitionCost,
  4500,
  'Negotiated acquisition cost',
)

assertEqual(
  negotiatedDeal.estimatedProfit,
  1500,
  'Negotiated profit',
)

assertClose(
  negotiatedDeal.roiPercent,
  (1500 / 4500) * 100,
  'Negotiated ROI',
)

console.log('PASS')
console.log(negotiatedDeal)

console.log()
console.log('===== SCENARIO 4 — COSTS CHANGE THE DEAL =====')

const costHeavy = calculateAcquisitionCosts({
  askingPrice: 3000,
  expectedPurchasePrice: 2500,
  estimatedRepairCost: 700,
  estimatedTransportCost: 300,
  estimatedTaxesAndRegistration: 250,
  estimatedTransactionFees: 150,
  estimatedOtherCosts: 100,
})

const costHeavyDeal = calculateDealEconomics({
  acquisitionCosts: costHeavy,
  estimatedResaleValue: 4500,
})

assertEqual(
  costHeavy.totalAcquisitionCost,
  4000,
  'Cost-heavy acquisition cost',
)

assertEqual(
  costHeavyDeal.estimatedProfit,
  500,
  'Cost-heavy profit',
)

assertClose(
  costHeavyDeal.roiPercent,
  12.5,
  'Cost-heavy ROI',
)

console.log('PASS')
console.log(costHeavyDeal)

console.log()
console.log('===== SCENARIO 5 — ZERO COST EDGE CASE =====')

const zeroCosts = calculateAcquisitionCosts({
  askingPrice: 0,
  expectedPurchasePrice: 0,
  estimatedRepairCost: 0,
  estimatedTransportCost: 0,
  estimatedTaxesAndRegistration: 0,
  estimatedTransactionFees: 0,
  estimatedOtherCosts: 0,
})

const zeroDeal = calculateDealEconomics({
  acquisitionCosts: zeroCosts,
  estimatedResaleValue: 1000,
})

assertEqual(
  zeroDeal.totalAcquisitionCost,
  0,
  'Zero acquisition cost',
)

assertEqual(
  zeroDeal.estimatedProfit,
  1000,
  'Zero-cost profit',
)

assertEqual(
  zeroDeal.roiPercent,
  0,
  'Zero-cost ROI safety behavior',
)

console.log('PASS')
console.log(zeroDeal)

console.log()
console.log('===== ALL DEAL ECONOMICS SCENARIOS PASSED =====')
