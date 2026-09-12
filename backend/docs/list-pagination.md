# List Pagination

The following GET endpoints now return an object instead of a bare array:

| Endpoint | sortBy values | Additional filters |
| --- | --- | --- |
| /products | createdAt, name, sellerPrice | categoryId, isFeatured, isNewArrival |
| /admin/products | createdAt, name, sellerPrice | status, categoryId, isFeatured, isNewArrival |
| /admin/customers | createdAt, name, email | governorate |
| /admin/coupons | createdAt, code, expiresAt | code (exact, normalized uppercase), isActive |
| /admin/orders | createdAt, total, orderNumber | status, customerId, governorate |
| /admin/returns | createdAt, status | status, orderId, customerId |

Admin-prefixed lists require an admin bearer token. The public products endpoint
always limits results to active products and does not accept a status filter.

## Shared Query Parameters

- `page`: positive integer, default 1, maximum 1000000.
- `limit`: positive integer, default 20, maximum 100.
- `search`: trimmed, nonempty text, maximum 150 characters. Case-insensitive
  substring matching; percent signs, underscores and backslashes are literal.
- `sortBy`: one of the endpoint's allowed values, default `createdAt`.
- `sortOrder`: `asc` or `desc`, default `desc`. ID is the secondary sort key.
- `from` and `to`: optional ISO timestamps with timezone, inclusive bounds on
  the record's `createdAt`. Example: `2026-09-01T00:00:00Z`. `from` cannot exceed `to`.

Boolean filters accept only the strings `true` and `false`. Invalid recognized
parameters produce HTTP 400. Date-only values are not accepted; send explicit
timezone-aware timestamps and URL-encode query values.

Search covers product name/slug/SKU, customer name/email/phone, coupon code,
order number/customer name/phone, and return order number/reason respectively.

## Response

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

`total` counts all matching records before pagination. A page beyond the last
page returns empty `data` but retains the matching total. Each record keeps its
existing fields; customer password hashes and order access-token hashes remain
excluded from responses.

Counts and page data are separate queries, not a snapshot transaction. Concurrent
writes can change totals between those queries or shift rows between page requests.

Example: `GET /admin/orders?page=1&limit=20&status=pending&sortBy=createdAt&sortOrder=desc`

## Consumer Update

Replace direct array access with `response.data`; use `response.meta` for table
pagination. Send filters on every page request and reset to page 1 when filters
or sorting change. Detail endpoints, variant lists, customer order history and
customer return history retain their existing response contracts.

The shared Zod schema lives in `src/common/list-query.schema.ts`; the repository
query helper lives in `src/common/paginate-query.ts`. Module repositories still
own their joins, filters and allowed sort-column selection. Services continue
to own response sanitization. No schema migration or new dependency is needed.
