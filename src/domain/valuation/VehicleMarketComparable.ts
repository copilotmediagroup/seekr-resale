export interface VehicleMarketComparable {
  id: string
  source: string
  sourceUrl: string | null

  year: number
  make: string
  model: string
  trim: string | null

  mileage: number | null
  condition: string | null
  locationText: string | null

  askingPrice: number

  observedAt: string
}
