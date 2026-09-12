# Dashboard Overview

`GET /admin/dashboard/overview` returns the cross-domain summary used by the
dashboard home screen. It requires an admin bearer token.

## Query Parameters

- `from`: optional inclusive ISO timestamp with timezone.
- `to`: optional inclusive ISO timestamp with timezone.
- `lowStockThreshold`: optional integer from 0 to 10000; defaults to 5.

If omitted, `from` and `to` leave the reporting period unbounded. `from` cannot
be later than `to`.

## Response Shape

```json
{
  "period": {
    "from": "2026-09-01T00:00:00.000Z",
    "to": "2026-09-30T23:59:59.000Z"
  },
  "orders": {
    "total": 42,
    "grossSales": "12500.00",
    "byStatus": {
      "pending": 4,
      "confirmed": 6,
      "shipped": 5,
      "delivered": 25,
      "cancelled": 2
    },
    "recent": []
  },
  "payments": {
    "collected": "9000.00",
    "refunded": "500.00",
    "netCollected": "8500.00"
  },
  "returns": {
    "totalInPeriod": 3,
    "pending": 1
  },
  "customers": {
    "total": 120,
    "newInPeriod": 14
  },
  "catalog": {
    "products": 35,
    "lowStockVariants": 4,
    "outOfStockVariants": 2,
    "lowStockThreshold": 5
  }
}
```

## Metric Definitions

- Order counts and `grossSales` use `orders.createdAt` within the requested
  period. Gross sales excludes cancelled orders.
- `collected` sums payment amounts whose current status is `paid`,
  `partially_refunded`, or `refunded`, for orders created in the period.
- `refunded` sums completed refund records by `refundedAt` within the period.
  `netCollected` is collected minus refunded and can be negative.
- `totalInPeriod` uses return creation time. `pending` is the current all-time
  count of returns with status `requested`.
- Customer `total` is current all-time count; `newInPeriod` uses customer
  creation time.
- Catalog counts are current all-time values. Stock counters include only
  active variants of active products and use available stock (`stock - reserved`).
  Low stock is greater than zero and at or below the threshold.
- `recent` contains up to five orders from the selected period and excludes
  internal access-token and idempotency fields.

Payment records currently have no `paidAt` column. Therefore `collected` cannot
yet be grouped by the exact collection date; its period is based on order creation.
Add a payment event timestamp before using this endpoint for accounting reports.

The dashboard service only composes domain summaries. Orders, payments, returns,
customers, and products retain ownership of their database aggregation queries.
No database migration or additional package is required for this endpoint.
