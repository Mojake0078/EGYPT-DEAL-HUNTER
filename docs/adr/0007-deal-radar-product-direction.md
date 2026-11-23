# ADR 0007: EGYPT DEAL HUNTER product scope and hourly Deal Radar

- Status: Accepted for product direction; Deal Radar implementation pending
- Date: 2026-11-23

## Context

The initial application is a watch-list price comparison tool. It checks a known query and stores offers, but it does not discover arbitrary new discounted products across all stores. The product goal is broader: discover genuine deals, produce an hourly report, and support monetization through approved affiliate links and social publishing.

## Decisions

### Brand

The product-facing name is EGYPT DEAL HUNTER. Root package metadata, Compose project/image names, web page title, and visible web heading use this brand. Internal workspace package identifiers remain implementation details for now to avoid a risky mass rename unrelated to product behavior. The vendored scraper's own README, license, author and copyright notices remain intact as required source attribution.

### Phase-one stores

Only Amazon Egypt (`amazon`), Jumia Egypt (`jumia`), and Noon Egypt (`noon`) are active in application scraping and demo data. The scraper library may retain adapters for future stores, but their presence in the library does not enable them in the application. Hyper One, Carrefour, Gomla Market and other stores are deferred.

### Two distinct workflows

1. Price Watch: user-selected product queries with stored observations and price-drop alerts.
2. Deal Radar: a separate hourly discovery pipeline for finding new products from store deal/category/sale sources.

The existing six-hour watch scheduler is not silently repurposed as an hourly market-wide discovery crawler. Deal Radar needs its own scheduler, source definitions, ingestion, history and report lifecycle.

### Deal verification

A deal must not be labeled confirmed merely because a product page shows a crossed-out list price. Prefer our own stored price history. Report current price, previous observed price, timestamp, 30-day observed low/median when enough samples exist, availability confidence, and original product URL. Use explicit labels for verified, candidate/unverified, and rejected/no reliable baseline.

### Reporting and monetization

Start with a machine-readable CSV export and a spreadsheet-friendly schema; add XLSX/Google Sheets integration after the data contract is stable. Preserve original product URLs separately from affiliate URLs. Affiliate support is conditional on an active program, Egypt eligibility, category commission rules, attribution window, and link requirements. Facebook publishing should initially be review-and-approve, not blind auto-posting; affiliate disclosure and platform/store terms must be respected.

## Consequences

- Current functionality remains truthful: product watch exists; market-wide hourly deal discovery is a planned new capability.
- The first Deal Radar release should focus on a small set of approved deal/category sources for the three phase-one stores rather than issuing repeated broad product searches.
- A product identity/matching layer and durable per-product price observations are needed to avoid duplicate products and false discount claims.
- A report should retain source timestamps and evidence so users can audit why a deal was selected.
- External affiliate and social APIs are optional adapters; core discovery and reporting must work without them.
