/**
 * Integration events exchanged over RabbitMQ. Past-tense facts (except the CheckRequested command),
 * versioned by additive change only. Money is always integer EGP piastres.
 */
export const EXCHANGE = 'price-watch.events'
export const RoutingKeys = {
  checkRequested: 'check.requested',
  priceObserved: 'price.observed',
  priceDropped: 'price.dropped',
} as const
export type RoutingKey = (typeof RoutingKeys)[keyof typeof RoutingKeys]
export type ShopStatusName = 'found' | 'none' | 'failed' | 'blocked'
export type StockStatusName = 'in_stock' | 'out_of_stock' | 'unknown'
export interface OfferDto {
  shop: string
  title: string
  pricePiastres: number
  url: string
  /** Optional only for compatibility with messages produced before the additive stock-status field. */
  stockStatus?: StockStatusName
  inStock: boolean
}
export interface ShopOutcomeDto {
  shop: string
  status: ShopStatusName
  error?: string
}
export interface CheckRequested {
  checkId: string
  watchId: string
  query: string
  requestedAt: string
}
export interface PriceObserved {
  checkId: string
  watchId: string
  query: string
  observedAt: string
  offers: OfferDto[]
  shops: ShopOutcomeDto[]
}
export type DropReason = 'below-target' | 'thirty-day-low'
export interface PriceDropped {
  alertKey: string
  watchId: string
  query: string
  pricePiastres: number
  targetPiastres: number
  shop: string
  url: string
  reasons: DropReason[]
  observedAt: string
}
export interface EventMap {
  'check.requested': CheckRequested
  'price.observed': PriceObserved
  'price.dropped': PriceDropped
}
