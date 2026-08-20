import type {
  Hunter,
  HunterCategory,
  MarketplaceSource,
} from './Hunter'

export type HunterThresholdKey = keyof Hunter['thresholds']

export const updateHunterName = (
  hunter: Hunter,
  name: string,
): Hunter => ({
  ...hunter,
  name,
})

export const updateHunterEnabled = (
  hunter: Hunter,
  enabled: boolean,
): Hunter => ({
  ...hunter,
  enabled,
})

export const updateHunterLocation = (
  hunter: Hunter,
  location: Partial<Hunter['location']>,
): Hunter => ({
  ...hunter,
  location: {
    ...hunter.location,
    ...location,
  },
})

export const updateHunterThreshold = (
  hunter: Hunter,
  key: HunterThresholdKey,
  value: number | null,
): Hunter => ({
  ...hunter,
  thresholds: {
    ...hunter.thresholds,
    [key]: value,
  },
})

export const addHunterCategory = (
  hunter: Hunter,
  category: HunterCategory,
): Hunter => ({
  ...hunter,
  categories: hunter.categories.includes(category)
    ? hunter.categories
    : [...hunter.categories, category],
})

export const removeHunterCategory = (
  hunter: Hunter,
  category: HunterCategory,
): Hunter => ({
  ...hunter,
  categories: hunter.categories.filter(
    (currentCategory) => currentCategory !== category,
  ),
})

export const addHunterSource = (
  hunter: Hunter,
  source: MarketplaceSource,
): Hunter => ({
  ...hunter,
  sources: hunter.sources.includes(source)
    ? hunter.sources
    : [...hunter.sources, source],
})

export const removeHunterSource = (
  hunter: Hunter,
  source: MarketplaceSource,
): Hunter => ({
  ...hunter,
  sources: hunter.sources.filter(
    (currentSource) => currentSource !== source,
  ),
})
