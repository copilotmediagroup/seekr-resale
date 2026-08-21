import type { Hunter } from '../../domain/hunters/Hunter'
import type { HunterRepository } from '../../domain/hunters/hunterRepository'

const STORAGE_KEY = 'seekr.hunters'

export class LocalStorageHunterRepository implements HunterRepository {
  async list(): Promise<Hunter[]> {
    return this.read()
  }

  async getById(id: string): Promise<Hunter | null> {
    const hunters = this.read()
    return hunters.find((hunter) => hunter.id === id) ?? null
  }

  async save(hunter: Hunter): Promise<void> {
    const hunters = this.read()
    const index = hunters.findIndex((existing) => existing.id === hunter.id)

    if (index === -1) {
      hunters.push(hunter)
    } else {
      hunters[index] = hunter
    }

    this.write(hunters)
  }

  async saveOrder(hunters: Hunter[]): Promise<void> {
    this.write(hunters)
  }

  async delete(id: string): Promise<void> {
    const hunters = this.read()
    this.write(hunters.filter((hunter) => hunter.id !== id))
  }

  private read(): Hunter[] {
    const raw = localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return []
    }

    try {
      const parsed: unknown = JSON.parse(raw)

      if (!Array.isArray(parsed)) {
        return []
      }

      return parsed as Hunter[]
    } catch {
      return []
    }
  }

  private write(hunters: Hunter[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(hunters))
  }
}
