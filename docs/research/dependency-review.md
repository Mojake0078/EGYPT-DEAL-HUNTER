# Dependency and independence review

- Review date: 2026-11-23
- Scope: identify dependencies on other repositories, hosted services, external runtimes and external data sources.

## Removed dependency

- The scraper implementation is now a complete source snapshot under `libs/egypt-price-scraper`.
- The scraper runtime imports the local built output.
- Docker builds the local library from the checked-out repository. It no longer clones the original GitHub repository.
- Original MIT license and attribution remain in the vendored library. The original repository is provenance only, not a build/runtime dependency.

## Remaining dependencies and decisions

| Dependency | Used for | Decision |
|---|---|---|
| Node.js 22 image | Runtime for API, checker and scraper | Keep. Standard runtime; pin image digest in a later reproducibility pass if needed. |
| npm registry packages | NestJS, React, TypeScript, gRPC, TypeORM, validation, telemetry and tooling | Keep package-managed with package-lock. Do not vendor all transitive dependencies; that would increase maintenance and security-update burden. |
| PostgreSQL 17 | Durable watches, observations, alerts and outbox | Keep. Self-hosted container, not a hosted database service. |
| RabbitMQ 4 | Durable event delivery, retries/dead-lettering and fan-out | Keep for the current architecture. Replacing it with a PostgreSQL job queue is possible but requires a deliberate architecture change and new reliability tests. |
| Nginx Alpine | Serves the built web frontend | Keep; small, standard static-file server. |
| Aspire Dashboard 9.5 | Optional OpenTelemetry trace viewing | Optional only; enabled by the `obs` Compose profile and not required by the product. Can be omitted in production. |
| GitHub Actions | CI and secret scanning | CI-only; does not run in the product. |
| Amazon Egypt, Jumia Egypt, Noon | Product and price data | Required external business data sources. Respect rate limits and site terms; no scraper can be independent of the stores it observes. |
| Pricena | Optional fallback/comparison source used by the vendored scraper | Keep as a fallback for now, especially when a direct shop search is blocked. It is not a fourth enabled retailer. Preserve source provenance and do not treat its relayed stock note as authoritative. |
| curl | Amazon Egypt request path in the scraper | Added to the scraper runtime image because the scraper's documented network adapter uses curl to avoid an Amazon bot challenge; it falls back to Node fetch if unavailable. |

## Scope controls

- The application-level allowlist activates only `amazon`, `jumia`, and `noon`.
- The vendored library still contains future-store adapters. Their presence does not activate them.
- Internal workspace names such as `@price-watch/*` remain implementation identifiers for compatibility in this pass; product-facing names, root package metadata, Compose project/images, browser title and web heading are branded EGYPT DEAL HUNTER. Renaming every internal import is a separate mechanical refactor and should not be mixed with behavior changes.

## Future hardening

1. Pin Docker image digests after choosing an update cadence for Node, PostgreSQL, RabbitMQ and Nginx.
2. Consider a configurable Pricena fallback switch after measuring direct-store success from the actual deployment environment.
3. Add per-store backoff/circuit-breaker state so blocked stores do not get hammered while the other two continue.
4. Keep optional observability off unless needed; do not add hosted monitoring as a product requirement.
5. Keep npm lockfile committed and review dependency updates through CI/security scanning.

## Conclusion

The project no longer depends on the separate scraper source repository. It still intentionally depends on standard open-source packages, self-hosted infrastructure images, and the three retailers as live data sources. Removing those would either make the product unable to function or require a substantial redesign; they are not equivalent to the removed project-to-project dependency.
