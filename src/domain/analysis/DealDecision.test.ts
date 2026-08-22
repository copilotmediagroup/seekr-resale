import { calculateDealDecision } from './DealDecision'

const assertEqual = (
  actual: unknown,
  expected: unknown,
  label: string,
) => {
  if (actual !== expected) {
    throw new Error(
      `${label}: expected ${String(expected)}, received ${String(actual)}`,
    )
  }
}

console.log(
  '===== SCENARIO 1 — ASK BELOW SEEKR BUY PRICE IS BUY =====',
)

const below = calculateDealDecision({
  askingPrice: 4000,
  seekrBuyPrice: 4900,
})

assertEqual(below.status, 'buy', 'Decision')
assertEqual(below.priceGap, 900, 'Price gap')

console.log('PASS')

console.log(
  '===== SCENARIO 2 — ASK EQUAL TO SEEKR BUY PRICE IS BUY =====',
)

const equal = calculateDealDecision({
  askingPrice: 4900,
  seekrBuyPrice: 4900,
})

assertEqual(equal.status, 'buy', 'Decision')
assertEqual(equal.priceGap, 0, 'Price gap')

console.log('PASS')

console.log(
  '===== SCENARIO 3 — ASK ABOVE SEEKR BUY PRICE REQUIRES NEGOTIATION =====',
)

const above = calculateDealDecision({
  askingPrice: 5000,
  seekrBuyPrice: 4900,
})

assertEqual(above.status, 'negotiate', 'Decision')
assertEqual(above.priceGap, -100, 'Price gap')

console.log('PASS')

console.log(
  '===== SCENARIO 4 — LARGE ASK GAP REMAINS NEGOTIATE WITHOUT INVENTED POLICY =====',
)

const farAbove = calculateDealDecision({
  askingPrice: 6500,
  seekrBuyPrice: 4900,
})

assertEqual(
  farAbove.status,
  'negotiate',
  'Decision',
)
assertEqual(
  farAbove.priceGap,
  -1600,
  'Price gap',
)

console.log('PASS')

console.log(
  '===== SCENARIO 5 — MISSING ASK IS PENDING =====',
)

const missingAsk = calculateDealDecision({
  askingPrice: null,
  seekrBuyPrice: 4900,
})

assertEqual(missingAsk.status, 'pending', 'Decision')
assertEqual(missingAsk.priceGap, null, 'Price gap')

console.log('PASS')

console.log(
  '===== SCENARIO 6 — MISSING SEEKR BUY PRICE IS PENDING =====',
)

const missingBuyPrice = calculateDealDecision({
  askingPrice: 4000,
  seekrBuyPrice: null,
})

assertEqual(
  missingBuyPrice.status,
  'pending',
  'Decision',
)
assertEqual(
  missingBuyPrice.priceGap,
  null,
  'Price gap',
)

console.log('PASS')

console.log(
  '===== ALL DEAL DECISION SCENARIOS PASSED =====',
)
