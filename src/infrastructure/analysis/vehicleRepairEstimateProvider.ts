import type {
  DealEstimateProvider,
  DealEstimationContext,
} from '../../domain/analysis/DealEstimator'
import type {
  MonetaryEstimate,
} from '../../domain/analysis/DealEstimate'
import { assessVehicleRepairRisk } from '../../domain/repairs/assessVehicleRepairRisk'

export class VehicleRepairEstimateProvider
  implements DealEstimateProvider
{
  readonly field = 'estimatedRepairCost' as const

  async estimate(
    context: DealEstimationContext,
  ): Promise<MonetaryEstimate | null> {
    const vehicle = context.listing.vehicle

    if (vehicle === null) {
      return null
    }

    const assessment =
      assessVehicleRepairRisk(vehicle)

    if (assessment.estimatedRepairCost === null) {
      return null
    }

    return {
      amount: assessment.estimatedRepairCost,
      confidence: assessment.confidence,
      origin: 'automated',
      basis: assessment.basis,
    }
  }
}
