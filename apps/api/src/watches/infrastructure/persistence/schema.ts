import { EntitySchema } from 'typeorm'
import type { Offer, ShopOutcome } from '../../domain/observation'

/** Persistence rows: plain shapes owned by the infrastructure layer, mapped to and from the domain by hand. */
export interface WatchRow {
  id: string
  query: string
  targetPiastres: number
  active: boolean
  createdAt: Date
  lastCheckedAt: Date | null
}

export interface ObservationRow {
  id: string
  watchId: string
  checkId: string
  observedAt: Date
  lowestPiastres: number | null
  lowestOffer: Offer | null
  healthy: boolean
  dropReasons: string[]
  offers: Offer[]
  shops: ShopOutcome[]
}

export interface AlertRow {
  id: string
  alertKey: string
  watchId: string
  pricePiastres: number
  reasons: string[]
  createdAt: Date
}

export interface OutboxRow {
  id: string
  routingKey: string
  payload: unknown
  traceHeaders: Record<string, string>
  createdAt: Date
  publishedAt: Date | null
  attempts: number
  lastError: string | null
}

export const WatchEntity = new EntitySchema<WatchRow>({
  name: 'Watch',
  tableName: 'watches',
  columns: {
    id: { type: 'uuid', primary: true },
    query: { type: 'varchar', length: 120 },
    targetPiastres: { name: 'target_piastres', type: 'integer' },
    active: { type: 'boolean' },
    createdAt: { name: 'created_at', type: 'timestamptz' },
    lastCheckedAt: { name: 'last_checked_at', type: 'timestamptz', nullable: true },
  },
})

export const ObservationEntity = new EntitySchema<ObservationRow>({
  name: 'Observation',
  tableName: 'observations',
  columns: {
    id: { type: 'uuid', primary: true },
    watchId: { name: 'watch_id', type: 'uuid' },
    checkId: { name: 'check_id', type: 'uuid', unique: true },
    observedAt: { name: 'observed_at', type: 'timestamptz' },
    lowestPiastres: { name: 'lowest_piastres', type: 'integer', nullable: true },
    lowestOffer: { name: 'lowest_offer', type: 'jsonb', nullable: true },
    healthy: { type: 'boolean' },
    dropReasons: { name: 'drop_reasons', type: 'jsonb' },
    offers: { type: 'jsonb' },
    shops: { type: 'jsonb' },
  },
})

export const AlertEntity = new EntitySchema<AlertRow>({
  name: 'Alert',
  tableName: 'alerts',
  columns: {
    id: { type: 'uuid', primary: true },
    alertKey: { name: 'alert_key', type: 'varchar', length: 200, unique: true },
    watchId: { name: 'watch_id', type: 'uuid' },
    pricePiastres: { name: 'price_piastres', type: 'integer' },
    reasons: { type: 'jsonb' },
    createdAt: { name: 'created_at', type: 'timestamptz' },
  },
})

export const OutboxEntity = new EntitySchema<OutboxRow>({
  name: 'OutboxMessage',
  tableName: 'outbox',
  columns: {
    id: { type: 'uuid', primary: true },
    routingKey: { name: 'routing_key', type: 'varchar', length: 100 },
    payload: { type: 'jsonb' },
    traceHeaders: { name: 'trace_headers', type: 'jsonb' },
    createdAt: { name: 'created_at', type: 'timestamptz' },
    publishedAt: { name: 'published_at', type: 'timestamptz', nullable: true },
    attempts: { type: 'integer', default: 0 },
    lastError: { name: 'last_error', type: 'text', nullable: true },
  },
})

export interface DealDiscoverySourceRow {
  id: string
  shop: 'amazon' | 'jumia' | 'noon'
  sourceKind: string
  locator: string
  enabled: boolean
  budgetPerRun: number
  createdAt: Date
  updatedAt: Date
}

export interface DealDiscoveryRunRow {
  id: string
  sourceId: string
  startedAt: Date
  finishedAt: Date | null
  status: 'queued' | 'running' | 'succeeded' | 'partial' | 'failed' | 'blocked'
  itemsSeen: number
  itemsPersisted: number
  error: string | null
}

export interface DealProductRow {
  id: string
  canonicalKey: string
  title: string
  brand: string | null
  model: string | null
  category: string | null
  gtin: string | null
  createdAt: Date
  updatedAt: Date
}

export interface DealListingRow {
  id: string
  productId: string | null
  shop: 'amazon' | 'jumia' | 'noon'
  externalId: string | null
  title: string
  originalUrl: string
  normalizedUrl: string
  affiliateUrl: string | null
  currentPricePiastres: number
  stockStatus: 'IN_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN'
  firstSeenAt: Date
  lastSeenAt: Date
  lastCheckedAt: Date
}

export interface DealPriceSnapshotRow {
  id: string
  listingId: string
  discoveryRunId: string
  pricePiastres: number
  stockStatus: 'IN_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN'
  observedAt: Date
}

export interface DealCandidateRow {
  id: string
  listingId: string
  currentPricePiastres: number
  baselineLow30dPiastres: number | null
  baselineMedian30dPiastres: number | null
  sampleCount30d: number
  discountVsMedianBps: number | null
  confidence: 'verified' | 'candidate' | 'insufficient_history'
  decisionReason: string
  evaluatedAt: Date
}

export interface DealReportRow {
  id: string
  periodStart: Date
  periodEnd: Date
  status: 'building' | 'ready' | 'failed'
  itemCount: number
  createdAt: Date
}

export interface DealReportItemRow {
  id: string
  reportId: string
  listingId: string
  snapshot: Record<string, unknown>
  createdAt: Date
}

const dealSource = new EntitySchema<DealDiscoverySourceRow>({
  name: 'DealDiscoverySource',
  tableName: 'deal_discovery_sources',
  columns: {
    id: { type: 'uuid', primary: true },
    shop: { type: 'varchar', length: 20 },
    sourceKind: { name: 'source_kind', type: 'varchar', length: 40 },
    locator: { type: 'text' },
    enabled: { type: 'boolean', default: true },
    budgetPerRun: { name: 'budget_per_run', type: 'integer' },
    createdAt: { name: 'created_at', type: 'timestamptz' },
    updatedAt: { name: 'updated_at', type: 'timestamptz' },
  },
})

const dealRun = new EntitySchema<DealDiscoveryRunRow>({
  name: 'DealDiscoveryRun',
  tableName: 'deal_discovery_runs',
  columns: {
    id: { type: 'uuid', primary: true },
    sourceId: { name: 'source_id', type: 'uuid' },
    startedAt: { name: 'started_at', type: 'timestamptz' },
    finishedAt: { name: 'finished_at', type: 'timestamptz', nullable: true },
    status: { type: 'varchar', length: 20 },
    itemsSeen: { name: 'items_seen', type: 'integer', default: 0 },
    itemsPersisted: { name: 'items_persisted', type: 'integer', default: 0 },
    error: { type: 'text', nullable: true },
  },
})

const dealProduct = new EntitySchema<DealProductRow>({
  name: 'DealProduct',
  tableName: 'deal_products',
  columns: {
    id: { type: 'uuid', primary: true },
    canonicalKey: { name: 'canonical_key', type: 'varchar', length: 240, unique: true },
    title: { type: 'text' },
    brand: { type: 'varchar', length: 160, nullable: true },
    model: { type: 'varchar', length: 160, nullable: true },
    category: { type: 'varchar', length: 120, nullable: true },
    gtin: { type: 'varchar', length: 32, nullable: true },
    createdAt: { name: 'created_at', type: 'timestamptz' },
    updatedAt: { name: 'updated_at', type: 'timestamptz' },
  },
})

const dealListing = new EntitySchema<DealListingRow>({
  name: 'DealListing',
  tableName: 'deal_listings',
  columns: {
    id: { type: 'uuid', primary: true },
    productId: { name: 'product_id', type: 'uuid', nullable: true },
    shop: { type: 'varchar', length: 20 },
    externalId: { name: 'external_id', type: 'varchar', length: 180, nullable: true },
    title: { type: 'text' },
    originalUrl: { name: 'original_url', type: 'text' },
    normalizedUrl: { name: 'normalized_url', type: 'text' },
    affiliateUrl: { name: 'affiliate_url', type: 'text', nullable: true },
    currentPricePiastres: { name: 'current_price_piastres', type: 'integer' },
    stockStatus: { name: 'stock_status', type: 'varchar', length: 20 },
    firstSeenAt: { name: 'first_seen_at', type: 'timestamptz' },
    lastSeenAt: { name: 'last_seen_at', type: 'timestamptz' },
    lastCheckedAt: { name: 'last_checked_at', type: 'timestamptz' },
  },
})

const dealSnapshot = new EntitySchema<DealPriceSnapshotRow>({
  name: 'DealPriceSnapshot',
  tableName: 'deal_price_snapshots',
  columns: {
    id: { type: 'uuid', primary: true },
    listingId: { name: 'listing_id', type: 'uuid' },
    discoveryRunId: { name: 'discovery_run_id', type: 'uuid' },
    pricePiastres: { name: 'price_piastres', type: 'integer' },
    stockStatus: { name: 'stock_status', type: 'varchar', length: 20 },
    observedAt: { name: 'observed_at', type: 'timestamptz' },
  },
})

const dealCandidate = new EntitySchema<DealCandidateRow>({
  name: 'DealCandidate',
  tableName: 'deal_candidates',
  columns: {
    id: { type: 'uuid', primary: true },
    listingId: { name: 'listing_id', type: 'uuid', unique: true },
    currentPricePiastres: { name: 'current_price_piastres', type: 'integer' },
    baselineLow30dPiastres: { name: 'baseline_low_30d_piastres', type: 'integer', nullable: true },
    baselineMedian30dPiastres: {
      name: 'baseline_median_30d_piastres',
      type: 'integer',
      nullable: true,
    },
    sampleCount30d: { name: 'sample_count_30d', type: 'integer' },
    discountVsMedianBps: { name: 'discount_vs_median_bps', type: 'integer', nullable: true },
    confidence: { type: 'varchar', length: 30 },
    decisionReason: { name: 'decision_reason', type: 'text' },
    evaluatedAt: { name: 'evaluated_at', type: 'timestamptz' },
  },
})

const dealReport = new EntitySchema<DealReportRow>({
  name: 'DealReport',
  tableName: 'deal_reports',
  columns: {
    id: { type: 'uuid', primary: true },
    periodStart: { name: 'period_start', type: 'timestamptz' },
    periodEnd: { name: 'period_end', type: 'timestamptz' },
    status: { type: 'varchar', length: 20 },
    itemCount: { name: 'item_count', type: 'integer', default: 0 },
    createdAt: { name: 'created_at', type: 'timestamptz' },
  },
})

const dealReportItem = new EntitySchema<DealReportItemRow>({
  name: 'DealReportItem',
  tableName: 'deal_report_items',
  columns: {
    id: { type: 'uuid', primary: true },
    reportId: { name: 'report_id', type: 'uuid' },
    listingId: { name: 'listing_id', type: 'uuid' },
    snapshot: { type: 'jsonb' },
    createdAt: { name: 'created_at', type: 'timestamptz' },
  },
})

export const ENTITIES = [
  WatchEntity,
  ObservationEntity,
  AlertEntity,
  OutboxEntity,
  dealSource,
  dealRun,
  dealProduct,
  dealListing,
  dealSnapshot,
  dealCandidate,
  dealReport,
  dealReportItem,
]
