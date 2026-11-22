import { join } from 'node:path'
export const SCRAPER_PROTO_PATH = join(__dirname, '..', 'proto', 'scraper.proto')
export const SCRAPER_PACKAGE = 'pricewatch.scraper.v1'
export const SCRAPER_SERVICE = 'Scraper'
export const PROTO_LOADER_OPTIONS = {
  keepCase: false,
  longs: Number,
  enums: String,
  defaults: true,
  arrays: true,
  oneofs: true,
} as const
export interface SearchRequestMessage {
  query: string
  shops: string[]
}
export type StockStatusMessage =
  | 'STOCK_STATUS_UNSPECIFIED'
  | 'STOCK_STATUS_IN_STOCK'
  | 'STOCK_STATUS_OUT_OF_STOCK'
  | 'STOCK_STATUS_UNKNOWN'
export interface OfferMessage {
  shop: string
  title: string
  pricePiastres: number
  url: string
  inStock: boolean
  /** Optional for compatibility with older sidecars; new sidecars always send it. */
  stockStatus?: StockStatusMessage
}
export type ShopStatusMessage =
  | 'SHOP_STATUS_UNSPECIFIED'
  | 'SHOP_STATUS_FOUND'
  | 'SHOP_STATUS_NONE'
  | 'SHOP_STATUS_FAILED'
  | 'SHOP_STATUS_BLOCKED'
export interface ShopResultMessage {
  shop: string
  status: ShopStatusMessage
  offers: OfferMessage[]
  error: string
}
export interface HealthReplyMessage {
  status: string
  mode: string
}
