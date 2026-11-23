# ADR 0006: Vendor the scraper library inside this repository

- Status: Accepted
- Date: 2026-11-23

## Context

The scraper sidecar previously fetched `egypt-price-scraper` from a separate GitHub repository during Docker image construction. That made builds depend on an external source repository and prevented this project from owning the scraper implementation end to end.

## Decision

The complete source snapshot is vendored at `libs/egypt-price-scraper`, including its shop adapters, matching and networking code, Pricena integration, tests, fixtures, package manifests, README, and original MIT license.

The vendored snapshot was taken from upstream commit `f7bfb67f02be5466ab91cc337386129c5ab71b89`. The original MIT copyright and license notice are retained in `libs/egypt-price-scraper/LICENSE`.

The application imports the built library from the repository-local path. Docker builds the library from this checkout and copies its built output into the scraper image. Docker must not clone or download the upstream GitHub repository.

## Consequences

- The application build and scraper runtime no longer depend on the upstream GitHub repository.
- The vendored library has its own lockfile, build, typecheck, and test commands.
- Updates to the scraper are reviewed and committed in this repository.
- The upstream URL is retained only as source provenance; it is not a build or runtime dependency.
- npm package installation and requests to the supported shopping sites still require network access.
