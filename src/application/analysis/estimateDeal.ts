import type {
  DealEstimateField,
  DealEstimateSet,
  MonetaryEstimate,
} from '../../domain/analysis/DealEstimate'
import {
  inspectDealEstimateCompleteness,
} from '../../domain/analysis/DealEstimate'
import type {
  DealEstimateProvider,
  DealEstimationContext,
} from '../../domain/analysis/DealEstimator'

export type DealEstimateOverrides = Partial<
  Record<DealEstimateField, MonetaryEstimate>
>

export interface EstimateDealInput
  extends DealEstimationContext {
  overrides?: DealEstimateOverrides
}

export interface DealEstimationResult {
  estimates: DealEstimateSet
  complete: boolean
  missing: DealEstimateField[]
}

const ESTIMATE_FIELDS: DealEstimateField[] = [
  'estimatedResaleValue',
  'expectedPurchasePrice',
  'estimatedRepairCost',
  'estimatedTransportCost',
  'estimatedTaxesAndRegistration',
  'estimatedTransactionFees',
  'estimatedOtherCosts',
]

export class DealEstimationService {
  private readonly providers: Map<
    DealEstimateField,
    DealEstimateProvider
  >

  constructor(providers: DealEstimateProvider[]) {
    this.providers = new Map()

    for (const provider of providers) {
      if (this.providers.has(provider.field)) {
        throw new Error(
          `Duplicate deal estimate provider registered for field: ${provider.field}`,
        )
      }

      this.providers.set(provider.field, provider)
    }
  }

  async estimate({
    listing,
    hunter,
    overrides = {},
  }: EstimateDealInput): Promise<DealEstimationResult> {
    const context: DealEstimationContext = {
      listing,
      hunter,
    }

    const estimates = {} as DealEstimateSet

    for (const field of ESTIMATE_FIELDS) {
      const override = overrides[field]

      if (override !== undefined) {
        estimates[field] = {
          ...override,
          origin: 'user',
        }

        continue
      }

      const provider = this.providers.get(field)

      estimates[field] = provider
        ? await provider.estimate(context)
        : null
    }

    const completeness =
      inspectDealEstimateCompleteness(estimates)

    return {
      estimates,
      complete: completeness.complete,
      missing: completeness.missing,
    }
  }
}
