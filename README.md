# satmis.com — Frontend

Web client for **satmis.com**, a second-hand car marketplace for the Turkish market: search, browse and
filter vehicle listings, publish and manage your own, keep a list of favorites, and see what similar
cars actually sold for.

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
  the backend allows are offered, and actions that are hard to undo ask for confirmation first. When
  an edit will send the listing back to review, the confirmation says so.
- **Marking as sold**: a sale panel prefills the asking price and accepts a sale price within
  80–110 % of it (the backend's rule), then asks for a final confirmation. A sold listing shows its
  sale and can be relisted, but can no longer be edited or deleted.
- **Sold vehicles** (`/satilmis-araclar`): browse completed sales with the same filters as the
  listings (the price filter applies to the sale price), sorted by sale date, sale price, year or
  mileage. A summary shows, per currency, how many cars sold and their average, lowest and highest
  sale price. Seller details are not shown.
- **Favorites**: one-click add/remove with instant feedback, plus a favorites page.
- **Accounts**: register, sign in, profile and password management. Sessions survive reloads and
  brief server outages, and stay in sync across browser tabs.
- **Email verification**: new accounts confirm their address through an e-mailed link before they
  can publish listings; unverified users see a banner with a resend button.
- **Password reset**: "forgot password" sends a one-time link, and the confirmation never reveals
  whether an address is registered.
- **Moderation**: new and edited listings wait for admin approval. Owners see the review status
  and, for a rejected listing, the reason they were given.
- **Reports**: signed-in users can report a listing they don't own by choosing a reason (a
  description is required for "Diğer", other); visitors are asked to sign in first. Reporting the
  same listing again shows a notice instead of an error.
- **Admin panel** (`/admin`, admins only): an approval queue filterable by status, a review page
  to approve, reject or unpublish a listing with a written reason, a report queue with a review page
  to dismiss the reports or take the listing down, a user list with e-mail search and
  block/unblock, and catalog management for adding brands, models and series. Admins can also hide
  a sale from the sold vehicles page.

## Engineering highlights

**Session handling with refresh-token rotation.** The refresh token lives in an httpOnly cookie
that JavaScript never sees, so an XSS bug cannot steal it; the access token is kept in memory only
and restored with a silent refresh on page load. The backend rotates the refresh token on every use
and treats reuse of an old one as theft, so a naive "refresh on 401" would log users out when two
requests or two tabs refresh at once. Refreshes are therefore single-flight within a tab and
serialized across tabs with the Web Locks API, and a `REFRESH_TOKEN_ROTATED` answer is retried
exactly once. Logging out in one tab ends the session in the others through a `BroadcastChannel`.

**Staying signed in through brief outages.** A refresh that fails with a network error, a `429` or
a `5xx` keeps the session; only the backend refusing the refresh (a `401` or `403`) ends it. When
no answer came back at all (a network error or a gateway `502`–`504`), the refresh is retried:
twice on page load, after 300 ms and 1 s, and once mid-session after about 2 s. That timing
matters: if the backend rotated the token but its answer was lost, a retry within its 30-second
window is answered with `REFRESH_TOKEN_ROTATED`, while a later one would count as theft and end all
of the user's sessions. The retries have fixed limits, so a backend that stays down is not flooded
with requests.

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
version instead of silently overwriting it. Admin decisions send the version that was reviewed
too: if the owner edits the listing in the meantime, the review page reloads it and asks the admin
to look again. Marking a listing as sold works the same way: a stale version is reported in the
sale panel and the listing is reloaded.

**Exact money arithmetic.** The sale panel checks the backend's 80–110 % rule before sending.
Prices can have 13 digits plus kuruş, and such a price multiplied by 110 no longer fits in a double
without losing kuruş, so the bounds are computed on integer kuruş with `BigInt` and rounded inwards.

**Roles are enforced by the backend.** The admin menu and routes are hidden from other users only
for convenience; every admin endpoint is authorized on the server, and a `403` sends the user out
of the admin section.

**Contract-driven error handling.** Form field names match the backend's error keys
(`vehicle.modelYear`, `imageIds`), so server-side validation errors appear under the right field.
Business-rule errors (`422`) and permission errors appear above the form. Where the backend adds an
error `code`, the app reacts to the code rather than the status: `PHONE_REQUIRED` sends the user to
their profile, `EMAIL_NOT_VERIFIED` shows the verification prompt, and `SALE_PRICE_OUT_OF_RANGE`
appears under the sale price.

**Accessibility.** Semantic HTML, labelled form controls with `aria-describedby` errors,
keyboard-operable dialogs that return focus to the control that opened them, live regions for
result counts and loading states, and support for reduced motion.

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

232 tests exercise the app, mostly through the UI like a user would, against MSW-mocked endpoints
rather than implementation details. They cover:

- token refresh races, multi-tab logout and session restore, including the rotated-token retry
- refresh failures: brief outages keep the session, and the mid-session retry (once, after about
  2 s, plus one retry for a rotated token) is checked on a fake clock
- no token ever written to web storage, and leftovers from older versions removed on startup
- login, register and password-change flows, including backend validation errors
- email verification (one request even under StrictMode) and password reset, including dead links
- rate limiting: a `429` on token refresh keeps the session, and `Retry-After` disables the form
- URL ↔ API filter mapping, cascading selects and empty/error states
- keyword search: sent only on submit, trimmed but otherwise unchanged (Turkish letters included),
  kept across paging, sorting and filter changes, and kept in sync with the URL on Back and Forward
- listing creation and editing, including `400`, `422` and `409` responses
- confirmations: nothing is sent before confirming, a double click sends one request, and an edit
  says whether it sends the listing back to review
- owner-only actions and allowed status transitions
- the sale panel: the 80–110 % range down to the kuruş, the backend's range and version errors, and
  relisting
- sold vehicles: filters read from the URL, the price summary, no seller details, and hiding a sale
- reports: who may report, reason validation and the "already reported" answer
- optimistic favorites with rollback, and a check that favoriting never triggers an extra detail request
- the admin panel: access rules, approve/reject with the reviewed version and a `409` reload,
  required reject reasons, block confirmation, duplicate catalog names, and dismissing reports or
  taking a reported listing down

```bash
npm test
```

GitHub Actions runs the format check, lint, tests and build on every pull request and push to
`main`, plus a dependency audit. Dependabot proposes dependency updates weekly, after a 7-day
cooldown for new releases.

## Getting started

Requires Node.js 24 (see `.nvmrc`) and the [backend](https://github.com/FeridunSrky/satmis-backend) running on
`http://localhost:8080`. In development, Vite proxies `/api` to the backend, so no CORS setup is
needed.

```bash
npm install
cp .env.example .env   # optional: VITE_APP_NAME
npm run dev            # http://localhost:5173
```

| Command                | Description                     |
| ---------------------- | ------------------------------- |
| `npm run dev`          | Development server              |
| `npm run build`        | Type check and production build |
| `npm run lint`         | oxlint + TypeScript             |
| `npm run format`       | Prettier                        |
| `npm run format:check` | Prettier check, as run in CI    |
| `npm test`             | Test suite                      |

## Project structure

Feature-based layout. Components never call the HTTP client directly; each feature owns its API
module and query hooks.

```
src/
  app/            router, providers, query client, layout and navigation
  features/
    auth/         session, token refresh and its retries, login/register forms, route guards
    user/         profile and password
    catalog/      brands, models, series, cities, districts
    listings/     search and filters, detail, listing form, owner actions, sale panel, reports
    soldVehicles/ sold vehicle search, price summary and detail
    favorites/    favorite toggle and favorites list
    admin/        listing and report review, user management, catalog management
  pages/          route components (lazy-loaded)
  shared/         HTTP client, error parsing, UI components, formatting
  test/           MSW server, fixtures, render helpers
```

## Roadmap

- SMS verification of phone numbers
