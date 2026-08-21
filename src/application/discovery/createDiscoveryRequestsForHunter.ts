import type { DiscoveryRequest } from '../../domain/discovery/DiscoveryRequest'
import type { Hunter } from '../../domain/hunters/Hunter'
import { validateHunter } from '../../domain/hunters/validateHunter'

export interface DiscoveryPlanningResult {
  requests: DiscoveryRequest[]
  errors: string[]
}

export const createDiscoveryRequestsForHunter = (
  hunter: Hunter,
): DiscoveryPlanningResult => {
  const errors = validateHunter(hunter).map(
    (error) => error.message,
  )

  if (!hunter.enabled) {
    errors.push('Hunter must be enabled before discovery can run.')
  }

  if (hunter.location.postalCode.trim().length === 0) {
    errors.push('Hunter must have a postal code before discovery can run.')
  }

  if (hunter.sources.length === 0) {
    errors.push(
      'Hunter must have at least one marketplace before discovery can run.',
    )
  }

  if (hunter.categories.length === 0) {
    errors.push(
      'Hunter must have at least one category before discovery can run.',
    )
  }

  if (errors.length > 0) {
    return {
      requests: [],
      errors,
    }
  }

  const location = {
    postalCode: hunter.location.postalCode,
    radiusMiles: hunter.location.radiusMiles,
  }

  return {
    requests: hunter.sources.map((source) => ({
      hunterId: hunter.id,
      source,
      location: { ...location },
      categories: [...hunter.categories],
    })),
    errors: [],
  }
}
