# Access Control

## Public Storefront

- `GET /products` returns only active products.
- `GET /products/:id` returns 404 for draft or archived products.
- Public variant and image routes return only active variants of active products.
- Storefront variant and cart payloads expose `isAvailable`, not raw stock or
  reserved quantities.
- Public shipping-rate reads return only active rates.
- Guest cart, quote, checkout, order access and return access work without an
  Authorization header using their existing guest tokens.

If an Authorization header is supplied to an optional-customer route, it must be
a valid customer bearer token. Invalid, expired, malformed and admin tokens return
401; they are no longer silently treated as guest requests.

## Admin API

These route groups require an admin bearer token:

- `/admin/admins`
- `/admin/customers`
- `/admin/coupons`
- `/admin/products`
- `/admin/shipping-rates`
- `/admin/orders`
- `/admin/returns`
- `/admin/dashboard`
- `/uploads/images`

Category writes remain at `/categories` and are individually guarded; category
reads remain public because categories currently have no visibility status.

Product and shipping-rate mutation routes were moved from their public prefixes
to `/admin/products` and `/admin/shipping-rates`. The former unprefixed admin,
customer and coupon collections were moved under `/admin` as well. Frontend API
clients must update these paths.

The admin-management API no longer provides an unauthenticated first-admin
bootstrap. A fresh database must have its first admin provisioned through a
trusted deployment or database seeding process before admin sign-in can succeed.

## Ownership

Customer order lists query by the authenticated customer ID. Order details require
the same owner ID, or a valid guest order token while the order is still unclaimed.
Return lists query through their owning orders, and return details reuse the same
order authorization check. Claiming a guest order clears its guest token hash, so
the token cannot access the order after ownership is attached.
