import {
  calculateSeekrBuyPrice,
} from './calculateSeekrBuyPrice'

const assertClose = (
  actual: number | null,
  expected: number,
  message: string,
) => {
  if (
    actual === null ||
    Math.abs(actual - expected) > 0.01
  ) {
    throw new Error(
      `${message}: expected ${expected}, received ${actual}`,
    )
  }
}

console.log(
  '===== SCENARIO 1 — PROFIT + ROI DETERMINE BUY PRICE =====',
)

const constrained = calculateSeekrBuyPrice({
  estimatedResaleValue: 7000,
  estimatedRepairCost: 200,
  estimatedTransportCost: 100,
  estimatedTaxesAndRegistration: 100,
  estimatedTransactionFees: 50,
  estimatedOtherCosts: 50,
  minimumExpectedProfit: 1500,
  minimumRoiPercent: 30,
  maximumSpend: 6000,
})

assertClose(
  constrained.maximumByProfit,
  5000,
  'Profit maximum',
)

assertClose(
  constrained.maximumByRoi,
  4884.62,
  'ROI maximum',
)

assertClose(
  constrained.maximumPurchasePrice,
  4884.62,
  'SEEKR Buy Price',
)

console.log('PASS')

console.log(
  '===== SCENARIO 2 — MAXIMUM SPEND CAN CAP BUY PRICE =====',
)

const spendCapped = calculateSeekrBuyPrice({
  estimatedResaleValue: 10000,
  estimatedRepairCost: 0,
  estimatedTransportCost: 0,
  estimatedTaxesAndRegistration: 0,
  estimatedTransactionFees: 0,
  estimatedOtherCosts: 0,
  minimumExpectedProfit: 1000,
  minimumRoiPercent: 10,
  maximumSpend: 4000,
})

assertClose(
  spendCapped.maximumPurchasePrice,
  4000,
  'Spend-capped SEEKR Buy Price',
)

console.log('PASS')

console.log(
  '===== SCENARIO 3 — NO ECONOMIC CONSTRAINT RETURNS NULL =====',
)

const unconstrained = calculateSeekrBuyPrice({
  estimatedResaleValue: 7000,
  estimatedRepairCost: 500,
  estimatedTransportCost: 0,
  estimatedTaxesAndRegistration: 0,
  estimatedTransactionFees: 0,
  estimatedOtherCosts: 0,
  minimumExpectedProfit: null,
  minimumRoiPercent: null,
  maximumSpend: null,
})

if (unconstrained.maximumPurchasePrice !== null) {
  throw new Error(
    'Unconstrained buy price must remain null.',
  )
}

console.log('PASS')

console.log(
  '===== SCENARIO 4 — IMPOSSIBLE ECONOMICS FLOOR AT ZERO =====',
)

const impossible = calculateSeekrBuyPrice({
  estimatedResaleValue: 3000,
  estimatedRepairCost: 1000,
  estimatedTransportCost: 500,
  estimatedTaxesAndRegistration: 500,
  estimatedTransactionFees: 500,
  estimatedOtherCosts: 500,
  minimumExpectedProfit: 1000,
  minimumRoiPercent: null,
  maximumSpend: null,
})

assertClose(
  impossible.maximumPurchasePrice,
  0,
  'Impossible economics',
)

console.log('PASS')

console.log(
  '===== SCENARIO 5 — ROI FORMULA MATCHES EXISTING SEEKR ECONOMICS =====',
)

const roiOnly = calculateSeekrBuyPrice({
  estimatedResaleValue: 7000,
  estimatedRepairCost: 200,
  estimatedTransportCost: 100,
  estimatedTaxesAndRegistration: 100,
  estimatedTransactionFees: 50,
  estimatedOtherCosts: 50,
  minimumExpectedProfit: null,
  minimumRoiPercent: 30,
  maximumSpend: null,
})

const purchasePrice =
  roiOnly.maximumPurchasePrice!

const totalInvestment =
  purchasePrice +
  roiOnly.nonPurchaseAcquisitionCosts

const profit =
  7000 - totalInvestment

const roi =
  (profit / totalInvestment) * 100

assertClose(
  roi,
  30,
  'Reverse-calculated ROI',
)

console.log('PASS')

console.log(
  '===== ALL SEEKR BUY PRICE SCENARIOS PASSED =====',
)
