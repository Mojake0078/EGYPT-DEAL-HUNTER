import {
  credentials,
  loadPackageDefinition,
  Metadata,
  type ClientReadableStream,
  type ServiceError,
} from '@grpc/grpc-js'
import { loadSync } from '@grpc/proto-loader'
import {
  PROTO_LOADER_OPTIONS,
  SCRAPER_PROTO_PATH,
  type OfferDto,
  type SearchRequestMessage,
  type ShopOutcomeDto,
  type ShopResultMessage,
  type ShopStatusName,
  type StockStatusName,
} from '@price-watch/contracts'
import type { ScrapeResult, ScraperClient } from '../application/ports'

interface ScraperStub {
  search(
    request: SearchRequestMessage,
    metadata: Metadata,
    options: { deadline: Date },
  ): ClientReadableStream<ShopResultMessage>
  close(): void
}

type ScraperCtor = new (
  address: string,
  creds: ReturnType<typeof credentials.createInsecure>,
) => ScraperStub

const STATUS: Record<ShopResultMessage['status'], ShopStatusName> = {
  SHOP_STATUS_UNSPECIFIED: 'failed',
  SHOP_STATUS_FOUND: 'found',
  SHOP_STATUS_NONE: 'none',
  SHOP_STATUS_FAILED: 'failed',
  SHOP_STATUS_BLOCKED: 'blocked',
}

const STOCK_STATUS: Record<string, StockStatusName> = {
  STOCK_STATUS_IN_STOCK: 'in_stock',
  STOCK_STATUS_OUT_OF_STOCK: 'out_of_stock',
  STOCK_STATUS_UNKNOWN: 'unknown',
  STOCK_STATUS_UNSPECIFIED: 'unknown',
}

function mapOffer(offer: ShopResultMessage['offers'][number]): OfferDto {
  const mapped =
    STOCK_STATUS[offer.stockStatus ?? 'STOCK_STATUS_UNSPECIFIED'] ?? 'unknown'
  // Old sidecars only supplied in_stock; preserve that behavior during a rolling upgrade.
  const stockStatus =
    (offer.stockStatus === undefined || offer.stockStatus === 'STOCK_STATUS_UNSPECIFIED') &&
    offer.inStock
      ? 'in_stock'
      : mapped

  return {
    shop: offer.shop,
    title: offer.title,
    pricePiastres: offer.pricePiastres,
    url: offer.url,
    stockStatus,
    inStock: stockStatus === 'in_stock',
  }
}

/** gRPC adapter. Partial results received before the deadline are retained. */
export class GrpcScraperClient implements ScraperClient {
  private readonly stub: ScraperStub

  constructor(address: string) {
    const definition = loadPackageDefinition(
      loadSync(SCRAPER_PROTO_PATH, PROTO_LOADER_OPTIONS),
    ) as unknown as {
      pricewatch: { scraper: { v1: { Scraper: ScraperCtor } } }
    }
    this.stub = new definition.pricewatch.scraper.v1.Scraper(
      address,
      credentials.createInsecure(),
    )
  }

  search(query: string, deadlineMs: number): Promise<ScrapeResult> {
    return new Promise((resolve) => {
      const offers: OfferDto[] = []
      const shops: ShopOutcomeDto[] = []
      const call = this.stub.search({ query, shops: [] }, new Metadata(), {
        deadline: new Date(Date.now() + deadlineMs),
      })
      call.on('data', (result: ShopResultMessage) => {
        shops.push({
          shop: result.shop,
          status: STATUS[result.status],
          ...(result.error ? { error: result.error } : {}),
        })
        offers.push(...result.offers.map(mapOffer))
      })
      call.on('end', () => resolve({ offers, shops }))
      call.on('error', (err: ServiceError) =>
        resolve({ offers, shops, error: `${err.code}: ${err.details || err.message}` }),
      )
    })
  }

  close(): void {
    this.stub.close()
  }
}
