import type {
  VehicleListingMetadata,
} from '../discovery/VehicleListingMetadata'
import { assessVehicleRepairRisk } from './assessVehicleRepairRisk'

const assert = (
  condition: boolean,
  message: string,
): void => {
  if (!condition) {
    throw new Error(message)
  }
}

const vehicle = (
  condition: string | null,
): VehicleListingMetadata => ({
  year: 2011,
  make: 'Toyota',
  model: 'Camry',
  trim: null,
  mileage: 150000,
  vin: null,
  condition,
})

console.log(
  '===== SCENARIO 1 — MISSING CONDITION DOES NOT INVENT COST =====',
)

const missing =
  assessVehicleRepairRisk(vehicle(null))

assert(
  missing.estimatedRepairCost === null,
  'Missing condition must not invent repair cost.',
)

assert(
  missing.confidence === 'low',
  'Missing condition should remain low confidence.',
)

console.log('PASS')
console.log()

console.log(
  '===== SCENARIO 2 — CLEAN CONDITION CAN SUPPORT ZERO =====',
)

const clean =
  assessVehicleRepairRisk(
    vehicle('Runs great, no mechanical issues'),
  )

assert(
  clean.estimatedRepairCost === 0,
  'Explicit clean condition should support zero known repairs.',
)

assert(
  clean.signals.some(
    (signal) => signal.severity === 'none',
  ),
  'Clean condition signal was not detected.',
)

console.log('PASS')
console.log()

console.log(
  '===== SCENARIO 3 — MINOR ISSUE IS DETECTED WITHOUT INVENTING PRICE =====',
)

const minor =
  assessVehicleRepairRisk(
    vehicle('Runs good but needs brakes'),
  )

assert(
  minor.estimatedRepairCost === null,
  'Minor issue must not receive an invented dollar cost.',
)

assert(
  minor.signals.some(
    (signal) => signal.severity === 'minor',
  ),
  'Minor repair signal was not detected.',
)

console.log('PASS')
console.log()

console.log(
  '===== SCENARIO 4 — MAJOR MECHANICAL RISK WINS =====',
)

const major =
  assessVehicleRepairRisk(
    vehicle(
      'Needs brakes and has a bad transmission',
    ),
  )

assert(
  major.estimatedRepairCost === null,
  'Major issue must remain unpriced without cost evidence.',
)

assert(
  major.basis.includes('major'),
  'Major repair severity did not win.',
)

console.log('PASS')
console.log()

console.log(
  '===== SCENARIO 5 — UNKNOWN CONDITION REMAINS UNKNOWN =====',
)

const unknown =
  assessVehicleRepairRisk(
    vehicle('Used vehicle in fair condition'),
  )

assert(
  unknown.estimatedRepairCost === null,
  'Unrecognized condition must not invent repair cost.',
)

assert(
  unknown.signals.length === 0,
  'Unknown condition should not create false signals.',
)

console.log('PASS')
console.log()

console.log(
  '===== VEHICLE REPAIR INTELLIGENCE DOMAIN PASSED =====',
)
