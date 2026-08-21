import type {
  VehicleListingMetadata,
} from '../discovery/VehicleListingMetadata'
import type {
  VehicleRepairAssessment,
  VehicleRepairSeverity,
  VehicleRepairSignal,
} from './VehicleRepairAssessment'

const normalizeText = (
  value: string | null,
): string | null => {
  const normalized = value?.trim().toLowerCase() ?? ''

  return normalized.length > 0
    ? normalized
    : null
}

const CONDITION_SIGNALS: Array<{
  terms: string[]
  severity: VehicleRepairSeverity
  description: string
}> = [
  {
    terms: [
      'parts only',
      'not running',
      'does not run',
      "doesn't run",
      'won’t run',
      "won't run",
      'blown engine',
      'bad engine',
      'bad transmission',
      'needs transmission',
      'needs engine',
    ],
    severity: 'major',
    description:
      'Listing condition indicates a major mechanical repair risk.',
  },
  {
    terms: [
      'mechanic special',
      'needs work',
      'needs repair',
      'project car',
      'overheating',
      'transmission issue',
      'engine issue',
    ],
    severity: 'moderate',
    description:
      'Listing condition indicates meaningful repair work may be required.',
  },
  {
    terms: [
      'minor issue',
      'minor issues',
      'needs brakes',
      'needs tires',
      'needs battery',
      'window does not work',
      "window doesn't work",
      'cosmetic damage',
    ],
    severity: 'minor',
    description:
      'Listing condition indicates a limited repair or maintenance need.',
  },
  {
    terms: [
      'excellent',
      'like new',
      'no issues',
      'no mechanical issues',
      'runs great',
      'runs perfect',
      'runs perfectly',
    ],
    severity: 'none',
    description:
      'Listing condition explicitly reports no material repair need.',
  },
]

const severityRank = (
  severity: VehicleRepairSeverity,
): number => {
  switch (severity) {
    case 'major':
      return 4
    case 'moderate':
      return 3
    case 'minor':
      return 2
    case 'none':
      return 1
    case 'unknown':
      return 0
  }
}

const detectSignals = (
  condition: string,
): VehicleRepairSignal[] =>
  CONDITION_SIGNALS
    .filter(({ terms }) =>
      terms.some((term) => condition.includes(term)),
    )
    .map(({ severity, description }) => ({
      severity,
      description,
    }))

const strongestSeverity = (
  signals: VehicleRepairSignal[],
): VehicleRepairSeverity =>
  signals.reduce<VehicleRepairSeverity>(
    (strongest, signal) =>
      severityRank(signal.severity) >
      severityRank(strongest)
        ? signal.severity
        : strongest,
    'unknown',
  )

export const assessVehicleRepairRisk = (
  vehicle: VehicleListingMetadata,
): VehicleRepairAssessment => {
  const condition = normalizeText(vehicle.condition)

  if (condition === null) {
    return {
      signals: [],
      estimatedRepairCost: null,
      confidence: 'low',
      basis:
        'Vehicle listing contains no usable condition evidence.',
    }
  }

  const signals = detectSignals(condition)

  if (signals.length === 0) {
    return {
      signals: [],
      estimatedRepairCost: null,
      confidence: 'low',
      basis:
        'Vehicle condition was provided but no recognized repair signal was found.',
    }
  }

  const severity = strongestSeverity(signals)

  if (severity === 'none') {
    return {
      signals,
      estimatedRepairCost: 0,
      confidence: 'medium',
      basis:
        'Seller-provided condition explicitly indicates no material repair need.',
    }
  }

  return {
    signals,
    estimatedRepairCost: null,
    confidence: 'low',
    basis:
      `Detected ${severity} repair-risk evidence; ` +
      'specific repair cost requires additional evidence.',
  }
}
