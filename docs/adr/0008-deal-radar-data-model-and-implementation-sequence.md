# ADR 0008: Deal Radar data model and first implementation sequence

- Status: Proposed implementation design
- Date: 2026-11-23
- Builds on: ADR 0007

## Context

The existing persistence model is intentionally centered on user-created watches:

- `watches` stores a search query and target price.
- `observations` stores the results of one watch check.
- `alerts` stores watch price-drop alerts.
- `outbox` reliably publishes application events.

The checker scheduler claims due watches every minute, while the default watch interval is six hours. This is not a market-wide discovery mechanism and must remain independent.

The current scraper contract accepts a text query and returns listings from the three enabled shops. It does not currently expose a general category-feed/crawl contract. Deal Radar must therefore begin with a bounded, curated discovery source list and must not pretend it can crawl every product in each store.

## Proposed bounded architecture

Keep Price Watch unchanged. Add an independent Deal Radar pipeline with four responsibilities:

1. **Discovery sources** — versioned, curated source definitions for Amazon Egypt, Jumia Egypt and Noon Egypt. Initial sources should be a small set of category/search seeds or explicitly supported sale pages. Each source has an enabled flag, shop, source kind, locator/query, and per-run budget.
2. **Discovery runner** — a dedicated hourly job with its own run ID, lease/claim mechanism, per-shop concurrency and deadlines. A failure or block at one shop must not stop the other shops.
3. **Product/listing history** — normalize a listing identity, persist the retailer listing, and append price/stock snapshots. Keep original product URL separate from any affiliate URL.
4. **Deal evaluation and reports** — evaluate only from our own observations, persist the evidence and decision, and generate a CSV report from immutable report-item snapshots.

Do not route discovery work through `watches`, `observations`, or the existing six-hour scheduler. Do not create a second RabbitMQ dependency or a new database.

## Proposed persistence model

Names are proposed and should be implemented through additive migrations only.

### `deal_discovery_sources`

- `id` UUID primary key
- `shop` constrained to `amazon`, `jumia`, `noon`
- `source_kind` (initially `search_seed`; add category/sale-page only when the scraper supports it)
- `locator` (query or supported source locator)
- `enabled` boolean
- `budget_per_run` positive integer
- `created_at`, `updated_at`
- unique key on (`shop`, `source_kind`, `locator`)

### `deal_discovery_runs`

- `id` UUID primary key
- `source_id` FK
- `started_at`, `finished_at`
- `status`: queued/running/succeeded/partial/failed/blocked
- `items_seen`, `items_persisted`
- `error` nullable
- index on (`source_id`, `started_at`)

### `deal_products`

Canonical product identity across stores:
- `id` UUID primary key
- `canonical_key` unique
- `title`, `brand`, `model`, `category`
- `gtin` nullable
- `created_at`, `updated_at`

Matching rules must be conservative:
- exact GTIN/EAN is strongest;
- exact normalized brand + model is a candidate match;
- fuzzy title similarity alone must not silently merge two products.
- Preserve retailer listing identity even when canonical matching is uncertain.

### `deal_listings`

One retailer's offer/listing for a product:
- `id` UUID primary key
- `product_id` FK nullable until confidently matched
- `shop` constrained to the three phase-one shops
- `external_id` nullable
- `title`
- `original_url` required
- `normalized_url` required
- `affiliate_url` nullable and separate
- `current_price_piastres` positive integer
- `stock_status`: IN_STOCK/OUT_OF_STOCK/UNKNOWN
- `first_seen_at`, `last_seen_at`, `last_checked_at`
- unique key on (`shop`, `normalized_url`); add external ID uniqueness only where retailer semantics are verified.

### `deal_price_snapshots`

Append-only price evidence:
- `id` UUID primary key
- `listing_id` FK
- `discovery_run_id` FK
- `price_piastres` positive integer
- `stock_status`
- `observed_at`
- index on (`listing_id`, `observed_at` DESC)

Never overwrite historical snapshots. Deduplicate repeated observations only when the same listing, price, stock state and source run are being retried idempotently.

### `deal_candidates`

Latest evaluation for a listing:
- `id` UUID primary key
- `listing_id` unique FK
- `current_price_piastres`
- `baseline_low_30d_piastres` nullable
- `baseline_median_30d_piastres` nullable
- `sample_count_30d`
- `discount_vs_median_percent` nullable
- `confidence`: verified/candidate/insufficient_history
- `decision_reason`
- `evaluated_at`

A listing cannot be called a verified discount unless it has enough independent observations over a meaningful history window. The initial policy should require at least 7 price observations spanning at least 7 days; tune this only after observing real collection frequency. Until then, show it as a candidate, not a confirmed deal. Never treat the crossed-out MSRP as historical evidence.

### `deal_reports` and `deal_report_items`

- Report stores ID, creation time, period, status and item count.
- Report items snapshot the product/listing title, shop, current price, baseline values, discount, stock confidence, observed time, original URL, and evaluation evidence.
- Report items must not change when a listing is updated later.
- CSV is the first export format. XLSX/Google Sheets is a later adapter once the columns and data contract stabilize.

## Hourly scheduling and resilience

- Add a separate `DEAL_RADAR_INTERVAL_MS` defaulting to one hour.
- Use a database-backed lease/claim so multiple replicas cannot run the same source simultaneously.
- Apply per-shop concurrency, request deadlines, cooldown/backoff and explicit blocked status.
- A blocked Amazon source must not suppress Jumia or Noon results.
- Store every run outcome, including empty results and failures, so the report can distinguish "no deals found" from "source unavailable".
- Start with a deliberately small source/seed set and a hard per-run budget. Expand only after measuring response quality, rate limits and duplicate rate.
- Do not run broad unbounded searches or claim complete market coverage.

## Initial release order

1. Implement additive migrations, typed persistence rows and repository tests for sources, runs, listings and append-only snapshots.
2. Implement a bounded source registry and an hourly runner with leases, per-shop outcomes and tests; initially use only source kinds supported by the vendored scraper.
3. Implement conservative listing normalization and duplicate handling; keep uncertain product matches separate.
4. Implement candidate evaluation using our own price snapshots and explicit minimum-history requirements.
5. Implement immutable report items and CSV export.
6. Add review queue and optional affiliate-link adapter only after the core report is reliable. Keep original URLs available regardless of affiliate approval.
7. Add XLSX/Google Sheets and review-before-publish social integrations as separate optional adapters.

## Non-goals for the first release

- Replacing or changing Price Watch.
- Claiming full-catalog coverage for any retailer.
- Automatically publishing to Facebook without human approval.
- Generating affiliate links without approved program credentials and channel eligibility.
- Merging uncertain products based only on similar titles.
- Treating list price/MSRP as a verified historical baseline.

## Acceptance criteria

- Existing Price Watch API, schema, scheduler and behavior remain unchanged.
- Discovery is independently schedulable hourly and idempotent under retries/multiple replicas.
- Every persisted listing has a retailer, original URL, observation timestamp and explicit stock status.
- Historical prices are append-only and queryable by listing.
- "Verified deal" is backed by our own stored history and a documented minimum sample threshold.
- A failed/blocked shop is visible in run results and does not prevent other shops from completing.
- CSV exports retain source provenance and original URLs.
