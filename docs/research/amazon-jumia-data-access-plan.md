# Amazon and Jumia data-access plan

Date: 2026-11-23
Branch: fix/stock-status-and-matching

## Verified technical findings

- The vendored scraper's own README records Amazon.eg as flaky from datacenter IPs (bot checks; curl helps but does not guarantee success).
- The same README records Jumia as blocked from datacenter IPs by Cloudflare 403, while noting that most shops answer from a home connection.
- Therefore the current GitHub-hosted runner is not a reliable place to make direct Amazon/Jumia requests. Repeated retries or header changes are not a durable fix and can worsen rate limits.
- The current scanner already runs the original library's Pricena fallback through searchAll. It must keep source provenance and must not represent a Pricena relay as a direct retailer response.

## Policy and partner-access findings

- Amazon Egypt's official Associates policy says prices and availability may be displayed only when Amazon serves the price-bearing link or the data is obtained through PA-API under its license. It also says a site must not include a price-comparison tool unless Amazon approves it. The policy contains additional PA-API restrictions, including written prior approval for certain reuse/aggregation. Do not enable Amazon price-comparison display or affiliate-derived product data for this project without written Amazon approval that explicitly covers this use case.
- Amazon PA-API/Creators API documentation lists the Egypt marketplace, but API availability does not itself grant permission to build a cross-retailer comparison service.
- Jumia Egypt's public affiliate page describes a pay-per-sale affiliate program and says applicants need an active, high-traffic blog and approval. The public page reviewed does not document an open product-search API or public product feed. Do not assume affiliate approval grants unrestricted catalog API access.
- Noon seller Content API documentation is for sellers/integrators managing listings, not evidence of a public affiliate product-search feed. Do not repurpose seller credentials as a consumer catalog feed.

## Implementation decision (no paid API in this phase)

1. Keep Noon direct discovery running on GitHub Actions.
2. Keep Amazon and Jumia direct readers in the vendored library as best-effort sources, but report their blocked/failed status honestly. Do not add proxy rotation, CAPTCHA solving, or other access-control circumvention.
3. Keep Pricena as a fallback only where it actually returns a retailer offer; preserve `via: pricena`, the Pricena product URL, and an explicit source label.
4. Add an adapter only after a provider's documented terms and access method explicitly permit price comparison / price monitoring for this use case.
5. For Amazon, the gate is written approval from Amazon for the cross-store comparison use case. For Jumia, request written confirmation of a product feed/API or permitted data access for price monitoring; affiliate approval alone is not enough.
6. Do not label a store as covered when its direct source is blocked and no permitted fallback produced offers. Distinguish `blocked`, `failed`, and `no matching offers` in reports.

## Next engineering tasks

- Add per-shop source health and fallback provenance to persisted Deal Radar runs.
- Add a source adapter interface so direct HTML, Pricena, and future approved feeds can be swapped without changing product matching or history logic.
- Keep Price Watch unchanged and keep all work on `fix/stock-status-and-matching`; do not merge PR #1 without explicit approval.

## References

- Amazon Egypt Associates policies: https://affiliate-program.amazon.eg/help/operating/policies/
- Amazon Creators API Egypt locale: https://affiliate-program.amazon.com/creatorsapi/docs/en-us/locale-reference/egypt
- Jumia Egypt affiliate program: https://www.jumia.com.eg/sp-jumia-affiliate/
- Noon Content API (seller catalog management): https://noon-docs.noonpartners.dev/docs/content/content-api
- Vendored scraper README: `libs/egypt-price-scraper/README.md`
