# Apartment Management System — Execution Plan

> Academic project. Target: functional, demo-ready system. Not production-hardened.
> Analysis date: 2026-04-26

---

## Current State Summary

The project is ~80% complete. The backend has 30 REST endpoints across 7 resource domains, all Mongoose models are defined, and 17 of 18 frontend pages are wired to real API calls. The main gaps are a few broken/missing UI connections, missing admin workflows, and one core user flow (tenant payments) that is stubbed but not functional.

**What already works end-to-end:**
- Auth (register, login, JWT refresh, role-based routing)
- Public room listing and booking with Stripe Checkout
- Admin CRUD for rooms, tenants, complaints, bookings
- Tenant complaint submission and tracking
- Admin dashboard stats
- Email notifications via Nodemailer (complaint updates, overdue payment reminders)

---

## Phase 1 — Fix Broken Wiring (Highest Priority)

These are features that appear to work in the UI but are silently broken or disconnected.

### 1.1 Wire `NotificationBell` to the API

**File:** `src/components/shared/NotificationBell.tsx`

The component renders but never fetches. The backend route `GET /api/notifications` is fully implemented — it returns dynamically generated alerts based on payment due dates.

- Add a `useEffect` that calls `api.get('/notifications')` on mount
- Populate the bell badge count and dropdown list from the response
- Auto-refresh every 60 seconds or on page focus

### 1.2 Fix Tenant Payment Flow

**File:** `src/pages/tenant/TenantPayments.tsx`

The page currently calls `PATCH /api/payments/:id/pay` which just marks a record as paid with no actual money movement. For academic purposes this is fine, but the UI implies a real payment happens.

Two options (pick one):
- **Option A (simple):** Keep the mock flow but update the UI copy to say "Mark as Paid (Cash/Bank)" — honest about what it does.
- **Option B (full):** Route tenant payments through Stripe Checkout the same way bookings work: call a new endpoint `POST /api/payments/:id/checkout-session`, redirect to Stripe, confirm on return.

For academic work, Option A is sufficient.

### 1.3 Complete Admin Dashboard Charts

**File:** `src/pages/admin/AdminDashboard.tsx`, `src/components/admin/DashboardAI.tsx`

Chart.js is already installed. The stats data (`GET /api/dashboard/stats`) already returns revenue, occupancy, and complaint counts. Wire up:
- Monthly revenue bar chart (use `payment` data grouped by month)
- Room occupancy donut chart (occupied vs vacant vs maintenance)
- Complaint status breakdown chart

---

## Phase 2 — Missing Tenant Features

### 2.1 Tenant Profile Edit

**File:** `src/pages/tenant/TenantProfile.tsx`

The page reads `GET /api/tenants/me` and displays data. Add an edit form for:
- Phone number, alternate phone
- Emergency contact
- Occupation

The backend already accepts `PATCH /api/tenants/:id` — just needs a frontend form. No new backend code required.

### 2.2 Document Viewer for Tenants

**File:** `src/pages/tenant/TenantApplications.tsx`

The `BookingApplication` model stores uploaded document URLs (ID proof, address proof, etc.). The page lists bookings but doesn't show document links/previews. Add a "View Documents" section that renders `<a>` tags using `assetUrl()` for each uploaded file.

---

## Phase 3 — Missing Admin Features

### 3.1 Create Payment Records (Admin)

**File:** `src/pages/admin/AdminPayments.tsx`

The backend has `POST /api/payments` (admin only) but the UI has no "Add Payment" button or form. Add a modal with:
- Tenant selector (dropdown from `GET /api/tenants`)
- Room (auto-fill from tenant's assigned room)
- Amount, due date, method

This is the only way rent records enter the system, so without this UI an admin can only see seeded payments.

### 3.2 Booking Rejection with Reason

**File:** `src/pages/admin/AdminBookings.tsx`

`PATCH /api/bookings/:id` accepts a `rejectionReason` field but the UI's reject button doesn't prompt for one. Add a small modal/text input when clicking "Reject" so the reason gets stored and can be shown to the tenant in `TenantApplications`.

### 3.3 Show Rejection Reason to Tenant

**File:** `src/pages/tenant/TenantApplications.tsx`

Display `booking.rejectionReason` when a booking's status is `rejected`. The data is already returned by the API.

---

## Phase 4 — UX Polish

### 4.1 Add Pagination

All list endpoints return full collections with no limit. For demo datasets this is fine, but with the seed data it can look cluttered.

- Add `?page=` and `?limit=` query params to the backend list endpoints that need it (payments, complaints, bookings)
- Add simple prev/next pagination controls to the corresponding admin tables

### 4.2 Search and Filter Gaps

Some pages have filtering (AdminComplaints has status filter, AdminPayments has status filter) but others don't:
- **AdminRooms**: add filter by status (vacant/occupied/maintenance) and type (single/double/premium)
- **AdminTenants**: add search by name or room number

No backend changes needed — filter on the already-fetched client-side data.

### 4.3 Empty States

When lists return zero results (no complaints, no payments, etc.), most pages show a blank area. Add a simple empty-state message/icon for each list page.

---

## Phase 5 — Data Integrity

### 5.1 Cascading Deletes

Currently, deleting a tenant via `DELETE /api/tenants/:id` only removes the `TenantProfile` and `User`. It leaves orphaned `Payment`, `Complaint`, and `BookingApplication` records pointing to the deleted user.

In `tenant.controller.js` `deleteTenant`, after removing the user, also:
- Delete `Payment` records where `tenantId` matches
- Delete `Complaint` records where `tenantId` matches
- Update `Room.tenantId` to null if the room was assigned to this tenant

### 5.2 Room Status on Booking Approval

When a `BookingApplication` is approved, verify that `room.controller.js` (or `booking.controller.js`) sets `Room.status = 'occupied'` and `Room.tenantId = userId`. Confirm this is the case; if not, add it to the approval handler in `booking.controller.js`.

---

## Phase 6 — Final Demo Prep

### 6.1 Seed Data Quality

Review `server/src/seed.js` to ensure it creates a believable demo dataset:
- At least 10 rooms (mix of types and statuses)
- 3–4 tenants with room assignments
- Payment records spanning 3 months (mix of paid/pending/overdue)
- A few complaints in each status
- One pending booking application

### 6.2 Admin Password Setup

Run `node server/src/setAdminPassword.js` once after seeding to ensure a known admin password exists for demo login.

### 6.3 Landing Page

`src/pages/Landing.tsx` is fully static (by design — it's a marketing page). Verify the CTA buttons link correctly to `/rooms` (public listing) and `/login`.

---

## Summary Table

| Phase | Area | Effort | Priority |
|-------|------|--------|----------|
| 1.1 | Wire NotificationBell to API | ~1 hour | High |
| 1.2 | Fix/clarify tenant payment flow | ~30 min | High |
| 1.3 | Wire dashboard charts | ~2 hours | High |
| 2.1 | Tenant profile edit form | ~1 hour | Medium |
| 2.2 | Document viewer in applications page | ~30 min | Medium |
| 3.1 | Admin: create payment records UI | ~1.5 hours | High |
| 3.2 | Booking rejection reason modal | ~30 min | Medium |
| 3.3 | Show rejection reason to tenant | ~15 min | Low |
| 4.1 | Pagination | ~2 hours | Low |
| 4.2 | Search/filter gaps | ~1 hour | Low |
| 4.3 | Empty states | ~30 min | Low |
| 5.1 | Cascading deletes | ~30 min | Medium |
| 5.2 | Room status on booking approval | ~15 min | Medium |
| 6.1–6.3 | Demo prep (seed, admin, landing) | ~30 min | High |

**Recommended execution order:** Phase 1 → Phase 3 (items 3.1, 3.2) → Phase 5 → Phase 2 → Phase 6 → Phase 4 if time permits.
