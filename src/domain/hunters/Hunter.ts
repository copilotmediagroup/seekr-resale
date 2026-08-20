export type KnownMarketplaceSource =
  | 'facebook_marketplace'
  | 'craigslist'

export type MarketplaceSource =
  | KnownMarketplaceSource
  | (string & {})

export type KnownHunterCategory =
  | 'vehicles'
  | 'electronics'
  | 'tools'
  | 'appliances'
  | 'furniture'
  | 'collectibles'
  | 'other'

export type HunterCategory =
  | KnownHunterCategory
  | (string & {})

export interface HunterLocation {
  postalCode: string
  radiusMiles: number | null
}

export interface HunterThresholds {
  minimumSpend: number | null
  maximumSpend: number | null
  minimumExpectedProfit: number | null
  minimumRoiPercent: number | null
  minimumSeekrScore: number | null
}

export interface Hunter {
  id: string
  name: string
  enabled: boolean
  location: HunterLocation
  categories: HunterCategory[]
  sources: MarketplaceSource[]
  thresholds: HunterThresholds
}

export const createDefaultHunter = (): Hunter => ({
  id: 'hunter-1',
  name: 'My Hunter',
  enabled: true,

  location: {
    postalCode: '',
    radiusMiles: null,
  },

  categories: [],
  sources: [],

  thresholds: {
    minimumSpend: null,
    maximumSpend: null,
    minimumExpectedProfit: null,
    minimumRoiPercent: null,
    minimumSeekrScore: null,
  },
})
