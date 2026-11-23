import type { MigrationInterface, QueryRunner } from 'typeorm'

/** Additive foundation for the independent hourly Deal Radar pipeline. */
export class DealRadarSchema1763900000000 implements MigrationInterface {
  name = 'DealRadarSchema1763900000000'

  async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE deal_discovery_sources (
        id uuid PRIMARY KEY,
        shop varchar(20) NOT NULL CHECK (shop IN ('amazon', 'jumia', 'noon')),
        source_kind varchar(40) NOT NULL,
        locator text NOT NULL,
        enabled boolean NOT NULL DEFAULT true,
        budget_per_run integer NOT NULL CHECK (budget_per_run > 0),
        created_at timestamptz NOT NULL,
        updated_at timestamptz NOT NULL,
        UNIQUE (shop, source_kind, locator)
      )`)
    await q.query(`
      CREATE TABLE deal_discovery_runs (
        id uuid PRIMARY KEY,
        source_id uuid NOT NULL REFERENCES deal_discovery_sources(id) ON DELETE RESTRICT,
        started_at timestamptz NOT NULL,
        finished_at timestamptz,
        status varchar(20) NOT NULL CHECK (status IN ('queued', 'running', 'succeeded', 'partial', 'failed', 'blocked')),
        items_seen integer NOT NULL DEFAULT 0 CHECK (items_seen >= 0),
        items_persisted integer NOT NULL DEFAULT 0 CHECK (items_persisted >= 0),
        error text
      )`)
    await q.query(`CREATE INDEX ix_deal_runs_source_time ON deal_discovery_runs (source_id, started_at DESC)`)
    await q.query(`
      CREATE TABLE deal_products (
        id uuid PRIMARY KEY,
        canonical_key varchar(240) NOT NULL UNIQUE,
        title text NOT NULL,
        brand varchar(160),
        model varchar(160),
        category varchar(120),
        gtin varchar(32),
        created_at timestamptz NOT NULL,
        updated_at timestamptz NOT NULL
      )`)
    await q.query(`CREATE INDEX ix_deal_products_gtin ON deal_products (gtin) WHERE gtin IS NOT NULL`)
    await q.query(`
      CREATE TABLE deal_listings (
        id uuid PRIMARY KEY,
        product_id uuid REFERENCES deal_products(id) ON DELETE SET NULL,
        shop varchar(20) NOT NULL CHECK (shop IN ('amazon', 'jumia', 'noon')),
        external_id varchar(180),
        title text NOT NULL,
        original_url text NOT NULL,
        normalized_url text NOT NULL,
        affiliate_url text,
        current_price_piastres integer NOT NULL CHECK (current_price_piastres > 0),
        stock_status varchar(20) NOT NULL CHECK (stock_status IN ('IN_STOCK', 'OUT_OF_STOCK', 'UNKNOWN')),
        first_seen_at timestamptz NOT NULL,
        last_seen_at timestamptz NOT NULL,
        last_checked_at timestamptz NOT NULL,
        UNIQUE (shop, normalized_url)
      )`)
    await q.query(`CREATE INDEX ix_deal_listings_product ON deal_listings (product_id) WHERE product_id IS NOT NULL`)
    await q.query(`CREATE INDEX ix_deal_listings_shop_seen ON deal_listings (shop, last_seen_at DESC)`)
    await q.query(`
      CREATE TABLE deal_price_snapshots (
        id uuid PRIMARY KEY,
        listing_id uuid NOT NULL REFERENCES deal_listings(id) ON DELETE CASCADE,
        discovery_run_id uuid NOT NULL REFERENCES deal_discovery_runs(id) ON DELETE RESTRICT,
        price_piastres integer NOT NULL CHECK (price_piastres > 0),
        stock_status varchar(20) NOT NULL CHECK (stock_status IN ('IN_STOCK', 'OUT_OF_STOCK', 'UNKNOWN')),
        observed_at timestamptz NOT NULL,
        UNIQUE (listing_id, discovery_run_id)
      )`)
    await q.query(`CREATE INDEX ix_deal_snapshots_listing_time ON deal_price_snapshots (listing_id, observed_at DESC)`)
    await q.query(`
      CREATE TABLE deal_candidates (
        id uuid PRIMARY KEY,
        listing_id uuid NOT NULL UNIQUE REFERENCES deal_listings(id) ON DELETE CASCADE,
        current_price_piastres integer NOT NULL CHECK (current_price_piastres > 0),
        baseline_low_30d_piastres integer,
        baseline_median_30d_piastres integer,
        sample_count_30d integer NOT NULL CHECK (sample_count_30d >= 0),
        discount_vs_median_bps integer,
        confidence varchar(30) NOT NULL CHECK (confidence IN ('verified', 'candidate', 'insufficient_history')),
        decision_reason text NOT NULL,
        evaluated_at timestamptz NOT NULL
      )`)
    await q.query(`
      CREATE TABLE deal_reports (
        id uuid PRIMARY KEY,
        period_start timestamptz NOT NULL,
        period_end timestamptz NOT NULL,
        status varchar(20) NOT NULL CHECK (status IN ('building', 'ready', 'failed')),
        item_count integer NOT NULL DEFAULT 0 CHECK (item_count >= 0),
        created_at timestamptz NOT NULL,
        CHECK (period_end >= period_start)
      )`)
    await q.query(`
      CREATE TABLE deal_report_items (
        id uuid PRIMARY KEY,
        report_id uuid NOT NULL REFERENCES deal_reports(id) ON DELETE CASCADE,
        listing_id uuid NOT NULL REFERENCES deal_listings(id) ON DELETE RESTRICT,
        snapshot jsonb NOT NULL,
        created_at timestamptz NOT NULL,
        UNIQUE (report_id, listing_id)
      )`)
    await q.query(`CREATE INDEX ix_deal_report_items_report ON deal_report_items (report_id, created_at)`)
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE deal_report_items`)
    await q.query(`DROP TABLE deal_reports`)
    await q.query(`DROP TABLE deal_candidates`)
    await q.query(`DROP TABLE deal_price_snapshots`)
    await q.query(`DROP TABLE deal_listings`)
    await q.query(`DROP TABLE deal_products`)
    await q.query(`DROP TABLE deal_discovery_runs`)
    await q.query(`DROP TABLE deal_discovery_sources`)
  }
}
