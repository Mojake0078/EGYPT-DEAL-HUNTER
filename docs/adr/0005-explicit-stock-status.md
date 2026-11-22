# ADR 0005: Explicit three-state stock status

## Decision
Product stock is represented as `in_stock`, `out_of_stock`, or `unknown` across the scraper, gRPC contract, RabbitMQ event, API and web types.

Only an explicit `in_stock` result is eligible for cheapest-offer ranking and price-drop alerts. Unknown values are not interpreted as available.

The scraper library's `sold` field is not a stock signal by itself. The adapter accepts only a small set of unambiguous availability phrases; sales counts, nulls and unfamiliar text remain unknown.

## Compatibility
The existing protobuf `in_stock` field remains at field number 5. The new enum field `stock_status` is additive at field number 6. Older publishers and stored JSON offers remain readable through a conservative legacy fallback. New scraper output always sends the explicit status.

## Consequences
- Prevents ambiguous sales metadata from creating false in-stock offers or price alerts.
- Unknown stock may reduce the number of offers shown until a shop provides a clear availability signal.
- The database already stores offer payloads as JSONB, so no destructive schema migration is required.
