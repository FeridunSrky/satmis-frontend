# satmis.com — Frontend

Web client for **satmis.com**, a second-hand car marketplace for the Turkish market: search, browse and
filter vehicle listings, publish and manage your own, and keep a list of favorites.

Built with React 19, TypeScript (strict) and TanStack Query against a Spring Boot REST API
([satmis-backend](https://github.com/FeridunSrky/satmis-backend)).

## Features

- **Listing search**: search by keyword ("passat dizel") from the listings page or the header, and
  filter by brand → model → series, city → district, price, year, mileage, fuel, gearbox, body type,
  seller type and damage record, then sort and page through the results. The keyword and every
  filter live in the URL with readable Turkish parameters
  (`/ilanlar?q=passat+dizel&marka=13&kasa=suv&sayfa=2`), so searches can be bookmarked and shared,
  and the back button works as expected.
- **Listing detail**: image gallery, full vehicle specs, seller, view and favorite counts. The
  seller's phone number is shown to signed-in users only.
- **Publishing**: a multi-section form with cascading catalog selects, photo upload (up to 20 per
  listing, with progress and retry), image ordering (the first image is the cover) and validation
  that mirrors the backend rules. Photos are resized to at most 2048 px and re-encoded in the browser,
  which also strips EXIF/GPS data, then uploaded straight to object storage through a signed URL.
- **Owner tools**: edit, unpublish, republish, mark as sold or delete. Only the status transitions
  the backend allows are offered.
- **Favorites**: one-click add/remove with instant feedback, plus a favorites page.
- **Accounts**: register, sign in, profile and password management. Sessions survive reloads and
  stay in sync across browser tabs.
- **Email verification**: new accounts confirm their address through an e-mailed link before they
  can publish listings; unverified users see a banner with a resend button.
- **Password reset**: "forgot password" sends a one-time link, and the confirmation never reveals
  whether an address is registered.

## Engineering highlights

**Session handling with refresh-token rotation.** The refresh token lives in an httpOnly cookie
that JavaScript never sees, so an XSS bug cannot steal it; the access token is kept in memory only
and restored with a silent refresh on page load. The backend rotates the refresh token on every use
and treats reuse of an old one as theft, so a naive "refresh on 401" would log users out when two
requests or two tabs refresh at once. Refreshes are therefore single-flight within a tab and
serialized across tabs with the Web Locks API, and a `REFRESH_TOKEN_ROTATED` answer is retried
exactly once. Logging out in one tab ends the session in the others through a `BroadcastChannel`.

**The URL as the source of truth for search.** Filters are parsed from the URL with Zod. Invalid
values are dropped without breaking the rest of the query, and the parsed filters are mapped to the API's
parameter names (`sayfa` is 1-based in the URL, `page` is 0-based in the API). Changing a parent
filter clears its dependents (brand → model → series, city → district) and resets paging.
The keyword is sent only when the search is submitted, never on every keystroke. It is trimmed and
capped at the API's 100-character limit, but otherwise sent exactly as typed, because the backend
already handles case and Turkish letters (`IŞIKLI` = `ışıklı` = `isikli`). A new search starts from
page 1 and keeps the active filters and sort order, and the input follows the URL on Back and Forward.

**Server state done deliberately.** TanStack Query with query-key factories. Favorites update
optimistically and roll back on error. Because the backend counts a view on every detail request,
mutations write their results into the cache rather than refetching, so favoriting a listing does
not inflate its view count.

**Concurrent edits.** Listing updates carry a version number. When the backend answers
`409 Conflict`, the form explains that the listing changed elsewhere and offers to load the latest
version instead of silently overwriting it.

**Contract-driven error handling.** Form field names match the backend's error keys
(`vehicle.modelYear`, `imageUrls`), so server-side validation errors appear under the right field.
Business-rule errors (`422`) and permission errors appear above the form.

**Accessibility.** Semantic HTML, labelled form controls with `aria-describedby` errors,
keyboard-operable dialogs with focus management, live regions for result counts and loading states,
and support for reduced motion.

## Tech stack

| Area         | Choice                                                   |
| ------------ | -------------------------------------------------------- |
| UI           | React 19, TypeScript 7 (strict), Tailwind CSS v4         |
| Routing      | React Router 7 (data router, route-level code splitting) |
| Server state | TanStack Query 5                                         |
| Client state | Zustand 5                                                |
| Forms        | React Hook Form + Zod 4                                  |
| HTTP         | Axios with a single shared client and auth interceptors  |
| Testing      | Vitest, Testing Library, MSW (network-level API mocks)   |
| Quality      | oxlint (React, hooks, jsx-a11y rules), `tsc`, Prettier   |
| Build        | Vite 8                                                   |

## Testing

144 tests exercise the app through the UI like a user would, against MSW-mocked endpoints, rather
than testing implementation details. They cover:

- token refresh races, multi-tab logout and session restore, including the rotated-token retry
- no token ever written to web storage, and leftovers from older versions removed on startup
- login, register and password-change flows, including backend validation errors
- email verification (one request even under StrictMode) and password reset, including dead links
- rate limiting: a `429` on token refresh keeps the session, and `Retry-After` disables the form
- URL ↔ API filter mapping, cascading selects and empty/error states
- keyword search: sent only on submit, trimmed but otherwise unchanged (Turkish letters included),
  kept across paging, sorting and filter changes, and kept in sync with the URL on Back and Forward
- listing creation and editing, including `400`, `422` and `409` responses
- owner-only actions and allowed status transitions
- optimistic favorites with rollback, and a check that favoriting never triggers an extra detail request

```bash
npm test
```

## Getting started

Requires Node.js 24 (see `.nvmrc`) and the [backend](https://github.com/FeridunSrky/satmis-backend) running on
`http://localhost:8080`. In development, Vite proxies `/api` to the backend, so no CORS setup is
needed.

```bash
npm install
cp .env.example .env   # optional: VITE_APP_NAME
npm run dev            # http://localhost:5173
```

| Command          | Description                     |
| ---------------- | ------------------------------- |
| `npm run dev`    | Development server              |
| `npm run build`  | Type check and production build |
| `npm run lint`   | oxlint + TypeScript             |
| `npm run format` | Prettier                        |
| `npm test`       | Test suite                      |

## Project structure

Feature-based layout. Components never call the HTTP client directly; each feature owns its API
module and query hooks.

```
src/
  app/          router, providers, query client, layout and navigation
  features/
    auth/       session, token refresh, login/register forms, route guards
    user/       profile and password
    catalog/    brands, models, series, cities, districts
    listings/   keyword search and filters, detail, listing form, owner actions
    favorites/  favorite toggle and favorites list
  pages/        route components (lazy-loaded)
  shared/       HTTP client, error parsing, UI components, formatting
  test/         MSW server, fixtures, render helpers
```

## Roadmap

- SMS verification of phone numbers
- Admin moderation of new listings
