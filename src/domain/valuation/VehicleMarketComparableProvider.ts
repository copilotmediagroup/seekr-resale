import type { VehicleListingMetadata } from '../discovery/VehicleListingMetadata'
import type { VehicleMarketComparable } from './VehicleMarketComparable'

export interface VehicleMarketComparableQuery {
  hunterId: string
  vehicle: VehicleListingMetadata
  locationText: string | null
}

export interface VehicleMarketComparableProvider {
  findComparables(
    query: VehicleMarketComparableQuery,
  ): Promise<VehicleMarketComparable[]>
}
