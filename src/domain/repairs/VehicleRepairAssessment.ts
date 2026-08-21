import type {
  DealEstimateConfidence,
} from '../analysis/DealEstimate'

export type VehicleRepairSeverity =
  | 'none'
  | 'minor'
  | 'moderate'
  | 'major'
  | 'unknown'

export interface VehicleRepairSignal {
  severity: VehicleRepairSeverity
  description: string
}

export interface VehicleRepairAssessment {
  signals: VehicleRepairSignal[]
  estimatedRepairCost: number | null
  confidence: DealEstimateConfidence
  basis: string
}
