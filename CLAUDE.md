# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repo Is

EventHub is a QA practice platform by Rahul Shetty Academy. The **backend is hosted** at `https://eventhub.rahulshettyacademy.com` — there is no local backend to run. Users register for a personal sandboxed account, then write Playwright E2E tests against the hosted app.

The frontend source code lives in `frontend/` and can run locally against the hosted API, but the primary use of this repo is as a workspace for writing tests.

## Commands

```bash
# Run all Playwright tests (against hosted app)
npm run test

# Run Playwright with visual UI
npm run test:ui

# Run a single test file
npx playwright test tests/<file>.spec.js --reporter=line

# View the last HTML report
npm run test:report

# Run frontend dev server only (requires frontend/.env.local to point to hosted API)
npm run dev --prefix frontend

# Install dependencies
npm run setup
```

## Playwright Configuration

Tests are in `tests/` (create this directory). The `playwright.config.ts` already sets:
- `baseURL`: `https://eventhub.rahulshettyacademy.com`
- Browser: Chromium only, headless
- `fullyParallel: false`, `retries: 0`
- Screenshots/video on failure only

Each test must be self-contained: login → action → assert. Use test accounts you register at the hosted app — do **not** use `rahulshetty1@gmail.com` (blocked by the app to nudge users to register their own).

## Frontend Architecture

The pages in `frontend/app/` import from `@/components/` and `@/lib/` which are not committed to this repo. If running the frontend locally, those directories need to be populated. The page files are the authoritative reference for what the app does.

Auth is handled via `@/lib/hooks/useAuth` — JWT stored in browser, 7-day expiry. The root layout wraps children in `AuthGuard` and `AppShell`. Login/register pages bypass the guard.

The `@/lib/api/client.js` exports `BASE_URL` (from `NEXT_PUBLIC_API_URL` env var) and an Axios instance with interceptors. API calls flow through React Query hooks (`useEvents`, `useBookings`) which key their caches on filter objects.

## Business Rules (Critical for Tests)

- **Sandbox limits**: max 9 bookings per user, max 6 user-created events; oldest is auto-pruned on overflow (FIFO)
- **Booking ref format**: `EVT-XXXXXX`, first character matches the event title's first character (uppercase)
- **Seat management**: `availableSeats` decrements on booking, restores on cancellation (atomic)
- **Refund eligibility**: 1 ticket = eligible; >1 ticket = not eligible (client-side check only)
- **Static/Featured events**: seeded events (`isStatic: true`) are immutable — no edit/delete, always visible
- **Cross-user isolation**: accessing another user's booking returns "Access Denied"
- **Password rules**: min 8 chars, one uppercase, one number, one special character

## Test Selectors (`data-testid` attributes)

| `data-testid` | Element |
|---|---|
| `event-card` | Each event card in listings |
| `book-now-btn` | "Book Now" link on event card |
| `quantity-input` | Ticket quantity in booking form |
| `customer-name` | Full name input |
| `customer-email` | Email input |
| `customer-phone` | Phone input |
| `confirm-booking-btn` | Submit booking button |
| `booking-ref` | Booking reference shown post-confirmation |
| `booking-card` | Each booking card in My Bookings |
| `cancel-booking-btn` | Cancel booking button |
| `confirm-dialog-yes` | Confirm button in any confirmation dialog |
| `admin-event-form` | Admin create/edit event form |
| `event-title-input` | Title field in admin form |
| `add-event-btn` | Submit button in admin form |
| `event-table-row` | Each row in admin events table |
| `edit-event-btn` | Edit button in admin table row |
| `delete-event-btn` | Delete button in admin table row |
| `nav-events` | Navbar "Events" link |
| `nav-bookings` | Navbar "My Bookings" link |
| `register-email` | Email field on register page |
| `register-password` | Password field on register page |
| `register-btn` | Submit button on register page |

Some elements also carry plain `id` attributes matching their `data-testid` name, and CSS classes like `booking-ref`, `confirm-booking-btn`, `ticket-count` — prefer `data-testid` selectors.

## API Reference

Base URL: `https://eventhub.rahulshettyacademy.com/api` (Swagger UI at `/api/docs`)

| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| `POST` | `/auth/login` | No | Returns JWT |
| `POST` | `/auth/register` | No | Creates sandbox account |
| `GET` | `/events` | Yes | `?search=&category=&city=&page=&limit=` |
| `GET` | `/events/:id` | Yes | |
| `POST` | `/events` | Yes | Creates event (counts toward 6-event limit) |
| `PUT` | `/events/:id` | Yes | User-created events only |
| `DELETE` | `/events/:id` | Yes | Cascades bookings |
| `GET` | `/bookings` | Yes | `?status=&page=&limit=` |
| `GET` | `/bookings/:id` | Yes | |
| `GET` | `/bookings/ref/:ref` | Yes | Lookup by `EVT-XXXXXX` ref |
| `POST` | `/bookings` | Yes | Body: `{eventId, customerName, customerEmail, customerPhone, quantity}` |
| `DELETE` | `/bookings/:id` | Yes | Cancel; restores seats |
| `DELETE` | `/bookings` | Yes | Clear all user bookings |
| `GET` | `/config` | No | Returns `{showExploreLinks}` feature flag |
