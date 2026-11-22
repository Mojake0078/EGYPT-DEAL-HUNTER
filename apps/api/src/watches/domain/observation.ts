import type { StockStatusName } from '@price-watch/contracts'
import type { Piastres } from './money'
export interface Offer {
  shop: string
  title: string
  pricePiastres: Piastres
  url: string
  stockStatus?: StockStatusName
  /** Legacy field retained for previously stored offers and old event publishers. */
  inStock: boolean
}
export type ShopStatus = 'found' | 'none' | 'failed' | 'blocked'
export interface ShopOutcome {
  shop: string
  status: ShopStatus
  error?: string
}
export const MIN_ANSWERING_SHOPS = 2
export interface ObservationSnapshot {
  id: string
  watchId: string
  checkId: string
  observedAt: Date
  offers: Offer[]
  shops: ShopOutcome[]
  lowest: Offer | null
  healthy: boolean
  dropReasons: string[]
}
/** Unknown stock is never treated as available. Only explicit IN_STOCK (or legacy true) can rank or alert. */
export class Observation {
  private constructor(private readonly state: ObservationSnapshot) {}
  static fromCheck(input: {
    id: string
    watchId: string
    checkId: string
    observedAt: Date
    offers: Offer[]
    shops: ShopOutcome[]
  }): Observation {
    const answered = input.shops.filter((s) => s.status === 'found' || s.status === 'none').length
    const failed = input.shops.length - answered
    const healthy = answered >= MIN_ANSWERING_SHOPS && failed * 2 <= input.shops.length
    const lowest =
      input.offers
        .filter(
          (o) =>
            (o.stockStatus === 'in_stock' || (o.stockStatus === undefined && o.inStock)) &&
            Number.isInteger(o.pricePiastres) &&
            o.pricePiastres > 0,
        )
        .sort((a, b) => a.pricePiastres - b.pricePiastres)[0] ?? null
    return new Observation({ ...input, lowest, healthy, dropReasons: [] })
  }
  static restore(snapshot: ObservationSnapshot): Observation {
    return new Observation({ ...snapshot })
  }
  get lowest(): Offer | null {
    return this.state.lowest
  }
  get healthy(): boolean {
    return this.state.healthy
  }
  get observedAt(): Date {
    return this.state.observedAt
  }
  flagDrop(reasons: string[]): void {
    this.state.dropReasons = [...reasons]
  }
  snapshot(): ObservationSnapshot {
    return { ...this.state, offers: [...this.state.offers], shops: [...this.state.shops] }
  }
}
