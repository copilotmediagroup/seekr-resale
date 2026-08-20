import type { Hunter } from '../../domain/hunters/Hunter'
import type { HunterRepository } from '../../domain/hunters/hunterRepository'
import { validateHunter } from '../../domain/hunters/validateHunter'

export class HunterService {
  private readonly repository: HunterRepository

  constructor(repository: HunterRepository) {
    this.repository = repository
  }

  async listHunters(): Promise<Hunter[]> {
    return this.repository.list()
  }

  async getHunter(id: string): Promise<Hunter | null> {
    return this.repository.getById(id)
  }

  async saveHunter(hunter: Hunter): Promise<void> {
    const errors = validateHunter(hunter)

    if (errors.length > 0) {
      throw new Error(
        errors.map((error) => error.message).join(' ')
      )
    }

    await this.repository.save(hunter)
  }

  async deleteHunter(id: string): Promise<void> {
    await this.repository.delete(id)
  }
}
