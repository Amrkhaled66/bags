# Bags dashboard frontend

The first milestone implements foundation, authentication, the responsive admin
layout, and a live overview. Catalog, order, account, and configuration pages are
subsequent milestones. Their navigation entries are disabled until implemented.

## Development

Run `npm install` and `npm run dev`. The API defaults to http://localhost:3000;
configure `VITE_API_URL` using `.env.example` to change it. The backend CORS
allowlist must include the frontend origin. Sign in with an existing admin.
There is no public admin registration or password recovery endpoint.

Run `npm run build` and `npm run lint` to verify changes. Production hosting must
serve index.html for SPA paths. Vite environment variables are public build-time
configuration; never place secrets in them. The login photo is bundled locally
and sourced from Unsplash (photo-1553062407-98eeb64c6a62).

## Ownership

- `app`: composition, route registration, navigation and providers.
- `features`: domain API calls, hooks, types, validation, pages and components.
- `shared`: domain-independent HTTP transport, UI primitives and utilities.
- Feature public exports live in `index.ts`. Cross-feature alias deep imports are
  lint errors. Keep dependencies acyclic; shared cannot import features or app.
- Add folders only when populated. Do not create empty feature scaffolds.
- Pages compose hooks. API modules own endpoints; Query hooks own server caching.
- Keep money as backend decimal strings. Display labels must not invent currency
  or reporting semantics absent from the API.

## Authentication

The token is stored under `bags.admin.access-token`. It is script-readable and
must never be treated as an HttpOnly session. When local storage is unavailable,
the session works in memory for the current tab. No refresh endpoint exists.

Protected entry checks `/auth/admin/me`. An authenticated 401 removes the token
and clears Query cache. Login 401 displays invalid credentials. Connection
failures preserve the session and allow retry. Logout and cross-tab token changes
clear cached data. The backend remains the authorization boundary.

## Next milestones

1. Categories and Brands, with reusable image uploads.
2. Products, variants, inventory and image galleries.
3. Shipping rates and Coupons.
4. Orders, shipment tracking and payment actions; Returns and refunds.
5. Customers and Administrators.
6. Expand overview navigation once target pages exist, then integration checks.

Use shadcn Alert for feedback and Alert Dialog for confirmations. No Sonner.
No permanent test files: verify meaningful changes with build, lint and temporary
browser flows. Use temporary database fixtures and always clean them up.
