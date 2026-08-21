import type { Hunter } from './Hunter'

export interface HunterRepository {
  list(): Promise<Hunter[]>
  getById(id: string): Promise<Hunter | null>
  save(hunter: Hunter): Promise<void>
  saveOrder(hunters: Hunter[]): Promise<void>
  delete(id: string): Promise<void>
}
