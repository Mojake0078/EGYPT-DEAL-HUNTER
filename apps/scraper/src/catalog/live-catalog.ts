import type { ShopResultMessage, StockStatusMessage } from '@price-watch/contracts'
import { toPiastres, type ShopCatalog } from './shop-catalog'

/**
 * The subset of the `egypt-price-scraper` library this sidecar uses.
 * The library's `sold` field is not a reliable stock boolean: it may contain sales counts or be null.
 */
interface ScraperListing {
  source: string
  title: string
  url: string
  price: number | null
  sold: string | null
}

interface ScraperSourceOutcome {
  source: string
  status: 'found' | 'none' | 'failed' | 'blocked'
  error?: string
}

export interface ScraperLibrary {
  searchAll(
    query: string,
    options: { shops?: string[]; timeoutMs?: number; concurrency?: number },
  ): Promise<{ listings: ScraperListing[]; sources: ScraperSourceOutcome[] }>
}

const STATUS: Record<ScraperSourceOutcome['status'], ShopResultMessage['status']> = {
  found: 'SHOP_STATUS_FOUND',
  none: 'SHOP_STATUS_NONE',
  failed: 'SHOP_STATUS_FAILED',
  blocked: 'SHOP_STATUS_BLOCKED',
}

/**
 * Be deliberately conservative. Only explicit, unambiguous stock phrases are accepted.
 * Sales counts, nulls, unfamiliar text and ambiguous labels remain UNKNOWN.
 */
export function classifyStock(sold: string | null): StockStatusMessage {
  const value = sold?.trim().toLowerCase().replace(/\s+/g, ' ')
  if (!value) return 'STOCK_STATUS_UNKNOWN'
  if (/^(out of stock|currently unavailable|unavailable|sold out)$/.test(value))
    return 'STOCK_STATUS_OUT_OF_STOCK'
  if (
    /^(in stock|available|available now|add to cart|only \d+ left in stock)$/.test(value) ||
    /^only \d+ left$/.test(value)
  )
    return 'STOCK_STATUS_IN_STOCK'
  return 'STOCK_STATUS_UNKNOWN'
}

/** Loads the ESM-only library from CommonJS (TypeScript keeps this a real dynamic import under node16). */
export async function loadScraperLibrary(specifier = 'egypt-price-scraper'): Promise<ScraperLibrary> {
  const mod = (await import(specifier)) as ScraperLibrary
  if (typeof mod.searchAll !== 'function') throw new Error(`${specifier} does not export searchAll`)
  return mod
}

export interface LiveCatalogOptions {
  /** Time box per shop in ms. */
  shopTimeoutMs: number
  /** Shops read at once within one search. */
  shopConcurrency: number
}

/** Real searches through egypt-price-scraper. Reports every searched shop, including failures. */
export class LiveCatalog implements ShopCatalog {
  readonly mode = 'live' as const

  constructor(
    private readonly library: ScraperLibrary,
    private readonly options: LiveCatalogOptions,
  ) {}

  async *search(query: string, shops: string[]): AsyncIterable<ShopResultMessage> {
    const result = await this.library.searchAll(query, {
      shops: shops.length ? shops : undefined,
      timeoutMs: this.options.shopTimeoutMs,
      concurrency: this.options.shopConcurrency,
    })
    for (const outcome of result.sources) {
      const offers = result.listings
        .filter((l) => l.source === outcome.source && l.price !== null && l.price > 0)
        .map((l) => {
          const stockStatus = classifyStock(l.sold)
          return {
            shop: l.source,
            title: l.title,
            pricePiastres: toPiastres(l.price ?? 0),
            url: l.url,
            stockStatus,
            inStock: stockStatus === 'STOCK_STATUS_IN_STOCK',
          }
        })
      yield { shop: outcome.source, status: STATUS[outcome.status], offers, error: outcome.error ?? '' }
    }
  }
}
