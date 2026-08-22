import type { Hunter } from '../../domain/hunters/Hunter'
import type { HunterDiscoveryIntelligenceResult } from '../discovery/evaluateHunterDiscovery'

export interface HunterIntelligencePort {
  evaluateHunter(
    hunter: Hunter,
  ): Promise<HunterDiscoveryIntelligenceResult>
}
