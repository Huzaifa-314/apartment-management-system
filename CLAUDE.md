# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A full-stack apartment management system with a React/TypeScript frontend and an Express/Node.js backend. The two are separate npm workspaces — the frontend lives at the root and the backend lives in `server/`.

## Development Commands

```bash
npm run dev:all        # Start both frontend (Vite, port 5173) and backend (Express, port 5000) concurrently
npm run dev            # Frontend only (Vite dev server)
npm run server:dev     # Backend only (node --watch)
npm run build          # Build frontend to dist/
npm run lint           # ESLint across the frontend
npm run server:seed    # Seed the MongoDB database (server/src/seed.js)
node server/src/setAdminPassword.js  # Reset the admin account password
```

No test suite exists — there are no test files or test scripts.

## Architecture

### Frontend (`src/`)

- **React 18 + TypeScript + Vite** with Tailwind CSS for styling.
- **Routing**: React Router v6. Two protected route trees: `/admin/*` and `/tenant/*`, guarded by `ProtectedRoute` in `App.tsx` which checks `user.role`.
- **Auth**: `AuthContext` stores the current user and handles login/logout. JWTs are persisted in `localStorage` under keys `rms_access` and `rms_refresh`. The `api` client (`src/lib/api.ts`) is an Axios instance that auto-attaches the access token and silently refreshes it on 401 responses.
- **Contexts**: Three providers wrap the app — `ThemeProvider`, `AuthProvider`, `NotificationProvider`.
- **Types**: Canonical TypeScript types in `src/types/index.ts` — `User`, `Tenant`, `Room`, `Payment`, `Complaint`, `Notification`, `FinancialSummary`.
- `assetUrl()` in `src/lib/api.ts` prepends `VITE_API_URL` to relative paths returned by the server (used for uploaded files).

### Backend (`server/src/`)

- **Express + Mongoose**. ESM throughout (`"type": "module"`).
- **Entry point**: `server/src/index.js` — wires CORS, connects MongoDB, starts the cron job, and mounts all routes under `/api`.
- **Router**: `server/src/routes/index.js` exports `createRouter(env)` which registers all routes in one place. Auth middleware (`requireAuth`, `requireRole`) is applied per-route; no global auth middleware.
- **Auth flow**: Login returns `accessToken` + `refreshToken`. Refresh tokens are stored in the `RefreshToken` collection. `POST /api/auth/refresh` rotates them.
- **File uploads**: `multer` middleware writes to `server/uploads/`. `mapUploadUrls` middleware converts `req.files` paths into URL-safe strings before they reach controllers. Two upload contexts: `tenants` (admin-created) and `bookings` (public applications). Uploaded files are served statically at `/uploads`.
- **Background jobs**: `server/src/jobs/paymentReminders.cron.js` — runs on a schedule via `node-cron` to send email reminders for overdue payments.
- **Email**: Nodemailer, configured via `initMailer()` from environment variables at startup.

### Key Data Model Relationships

These relationships require reading multiple files to understand:

- **User vs TenantProfile**: `User` handles auth only (email, password, role). Extended tenant data (room assignment, lease dates, documents, emergency contact) lives in a separate `TenantProfile` document linked by `userId`. Always check both when working with tenant data.
- **Payment records are admin-created**: Admins create `Payment` records; tenants can only mark existing ones as paid via `PATCH /api/payments/:id/pay`. There is no tenant-initiated payment creation.
- **Booking → Tenant promotion flow**: When an admin approves a `BookingApplication`, the backend sets `Room.tenantId` and creates a `TenantProfile`. This is the only path to becoming an assigned tenant with a room.
- **Booking draft**: `src/lib/bookingDraft.ts` persists partial booking form data to `localStorage`, bridging the `PublicRooms → BookingForm` navigation. Clear it after a successful submission.

### Known Incomplete Wiring

- **NotificationBell** (`src/components/shared/NotificationBell.tsx`): The component exists and the backend route `GET /api/notifications` is implemented, but the component never actually calls the API — it renders without fetching. Needs an `api.get('/notifications')` call wired in.
- **TenantPayments SSLCommerz**: The payments page (`src/pages/tenant/TenantPayments.tsx`) shows a payment UI but only marks payments as paid via the simple `PATCH /api/payments/:id/pay` endpoint — it does **not** go through SSLCommerz. Only the booking flow has full SSLCommerz integration.
- **AdminDashboard charts**: `DashboardAI` and chart imports are present but chart rendering is minimal/placeholder.

### SSLCommerz Payment Flow (Booking Only)

`BookingForm` → POST `/api/bookings` (creates `BookingApplication`) → `BookingCheckout` → POST `/api/bookings/:id/checkout-session` (initializes SSLCommerz session) → SSLCommerz hosted page → redirect to `BookingSuccess` → GET `/api/bookings/confirm-checkout` (marks booking paid). SSLCommerz also sends IPN to `POST /api/bookings/ipn` for async payment confirmation.

### Environment variables

The server loads `../../.env` (project root) first, then `server/.env` — the latter takes precedence.

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string (default: `mongodb://127.0.0.1:27017/room-management`) |
| `JWT_SECRET` | Secret for signing JWTs |
| `PORT` | API port (default: `5000`) |
| `FRONTEND_URL` | Allowed CORS origin (default: `http://localhost:5173`) |
| `API_URL` | API base URL for SSLCommerz IPN callback (default: `http://localhost:5000`) |
| `SMTP_HOST/PORT/SECURE/USER/PASS` | Nodemailer config |
| `VITE_API_URL` | Frontend: base URL for API calls (empty = same origin) |
| `SSLCOMMERZ_STORE_ID` | SSLCommerz Store ID (required for booking checkout) |
| `SSLCOMMERZ_STORE_PASSWORD` | SSLCommerz Store Password/API Secret Key (required for booking checkout) |
| `SSLCOMMERZ_PRODUCTION` | Set to `'true'` for production, default is sandbox mode |
| `SSLCOMMERZ_CURRENCY` | Checkout currency (default: `BDT`) |

**Test payments:** Use SSLCommerz sandbox credentials (provided above).
