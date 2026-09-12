# Backend Handoff

## Runtime Configuration

Copy `.env.example` to `.env`. Required values are `DATABASE_URL` and a
`JWT_SECRET` of at least 32 characters. Production also requires `CORS_ORIGIN`.
Multiple CORS origins are comma-separated, exact HTTP(S) origins without paths.

Optional settings:

- `PORT` defaults to 3000.
- `DATABASE_POOL_MAX` defaults to 10.
- `JWT_EXPIRES_IN` defaults to `7d`.
- `IMAGE_DIRECTORY` defaults to `uploads/images`.
- `ORDER_RESERVATION_HOURS` defaults to 24 and may not exceed 168.

Uploaded images need persistent shared storage in multi-instance deployments.
Back up the image directory together with PostgreSQL data.

## Request Headers

- `Authorization: Bearer <token>` for customer or admin authentication.
- `X-Cart-Token` identifies a guest cart and should be persisted by the storefront.
- `Idempotency-Key` is a new UUID for each checkout attempt and must be reused
  when retrying that same attempt.
- `X-Order-Token` authorizes access to an unclaimed guest order and its returns.
- `X-Request-Id` is optional. Valid supplied IDs are echoed; otherwise the API
  generates one. The header is exposed through CORS.

The CORS policy permits the headers above and only origins configured by
`CORS_ORIGIN`.

## Route Groups

Public/customer routes:

- `/auth/customer/*`
- `/products`, `/categories`, `/shipping-rates`
- `/cart`
- `/orders`
- `/returns`
- `/uploads/images/*` static image reads

Admin routes:

- `/auth/admin/*`
- `/admin/admins`, `/admin/customers`, `/admin/products`
- `/admin/coupons`, `/admin/shipping-rates`
- `/admin/orders`, `/admin/returns`, `/admin/dashboard`
- `/uploads/images` mutation endpoints

Category mutation endpoints remain under `/categories` but require an admin token.
See `access-control.md` for visibility and ownership rules.

## Error Contract

All HTTP errors use this shape:

```json
{
  "statusCode": 400,
  "code": "BAD_REQUEST",
  "message": "Request validation failed",
  "details": [],
  "path": "/products/not-a-uuid",
  "method": "GET",
  "timestamp": "2026-09-09T12:00:00.000Z",
  "requestId": "request-id"
}
```

Expected domain errors retain their client-safe message. Validation information
is returned in `details`. Unexpected errors are logged with the request ID and
return a generic 500 response without database or stack information.

## Commerce Flow

1. Create or restore a guest cart with `POST /cart/session`.
2. Add items using `X-Cart-Token` and request `POST /orders/quote`.
3. Checkout with the cart token and `Idempotency-Key`.
4. Save the returned guest order token until the order is claimed.
5. A signed-in customer claims it through `POST /orders/:orderNumber/claim`.
6. Admin confirms the order, adds tracking, marks shipped, then delivered.
7. Delivery marks cash-on-delivery payment as paid.
8. Customer requests a return; admin approves and receives it.
9. Receiving restores inventory; refund completion creates the refund and updates
   payment status atomically.

Inventory reservation, checkout, order transitions, return processing, and cart
merging use database transactions. Serializable/deadlock failures are retried up
to three times. The expiration job locks and rechecks each pending order before
cancellation, preventing a stale candidate from cancelling a confirmed order.
Concurrent guest-cart merges for the same customer are serialized with a database
advisory lock.

## Operational Notes

- The reservation cleanup job runs every ten minutes and processes 100 orders per
  run.
- Public variants expose availability, not raw stock levels.
- Dashboard payment reporting uses order creation time because payments do not
  yet have a `paidAt` column; it is operational reporting, not an accounting ledger.
- The first admin must be provisioned through a trusted seed or database process.
- No email, online payment gateway, object storage, or carrier integration is
  configured in this version.
