import type { Hunter } from './Hunter'

export interface CreateHunterInput {
  id: string
  name?: string
}

export const createHunter = ({
  id,
  name = 'My Hunter',
}: CreateHunterInput): Hunter => ({
  id,
  name,
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
