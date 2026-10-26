# satmis.com — Frontend

Web client for **satmis.com**, a second-hand car marketplace for the Turkish market: browse and filter
vehicle listings, publish and manage your own, and keep a list of favorites.

Built with React 19, TypeScript (strict) and TanStack Query against a Spring Boot REST API
([satmis-backend](https://github.com/FeridunSrky/satmis-backend)).

## Features

- **Listing search**: filter by brand → model → series, city → district, price, year, mileage,
  fuel, gearbox, body type, seller type and damage record, then sort and page through the results.
  Every filter lives in the URL with readable Turkish parameters (`/ilanlar?marka=13&kasa=suv&sayfa=2`),
  so searches can be bookmarked and shared, and the back button works as expected.
- **Listing detail**: image gallery, full vehicle specs, seller, view and favorite counts.
- **Publishing**: a multi-section form with cascading catalog selects, image ordering (the first
  image is the cover) and validation that mirrors the backend rules.
- **Owner tools**: edit, unpublish, republish, mark as sold or delete. Only the status transitions
  the backend allows are offered.
- **Favorites**: one-click add/remove with instant feedback, plus a favorites page.
- **Accounts**: register, sign in, profile and password management. Sessions survive reloads and
  stay in sync across browser tabs.

## Engineering highlights

**Session handling with refresh-token rotation.** The access token is kept in memory only. The
backend rotates the refresh token on every use and treats reuse of an old one as theft, so a naive
"refresh on 401" would log users out when two requests or two tabs refresh at once. Refreshes are
therefore single-flight within a tab and serialized across tabs with the Web Locks API; the token is
re-read after the lock is acquired.

**The URL as the source of truth for search.** Filters are parsed from the URL with Zod. Invalid
values are dropped without breaking the rest of the query, and the parsed filters are mapped to the API's
parameter names (`sayfa` is 1-based in the URL, `page` is 0-based in the API). Changing a parent
filter clears its dependents (brand → model → series, city → district) and resets paging.

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

71 tests exercise the app through the UI like a user would, against MSW-mocked endpoints, rather
than testing implementation details. They cover:

- token refresh races, multi-tab logout and session restore
- login, register and password-change flows, including backend validation errors
- URL ↔ API filter mapping, cascading selects and empty/error states
- listing creation and editing, including `400`, `422` and `409` responses
- owner-only actions and allowed status transitions
- optimistic favorites with rollback, and a check that favoriting never triggers an extra detail request

```bash
npm test
```

## Getting started

Requires Node.js 20.19+ (or 22.12+) and the [backend](https://github.com/FeridunSrky/satmis-backend) running on
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
    listings/   search filters, detail, listing form, owner actions
    favorites/  favorite toggle and favorites list
  pages/        route components (lazy-loaded)
  shared/       HTTP client, error parsing, UI components, formatting
  test/         MSW server, fixtures, render helpers
```

## Roadmap

- Seller contact details on the listing page (phone shown to signed-in users)
- Image upload (listings currently take `https://` image URLs)
- Email and SMS verification at sign-up
