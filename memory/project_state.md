---
name: Project completion state
description: What's done, what's broken, and what's missing in the apartment management system
type: project
---

Project is ~80% complete (academic work, not production). 17/18 frontend pages are wired to real API. 30 backend endpoints exist and are functional.

**Why:** User is finishing an academic project and needs a phase-by-phase plan.
**How to apply:** Use EXECUTION_PLAN.md as the source of truth for what to work on next.

Key broken/missing items:
- NotificationBell component never calls GET /api/notifications (API exists, component doesn't fetch)
- TenantPayments "pay" button calls PATCH /api/payments/:id/pay (mock, not Stripe) — UI is misleading
- Admin has no UI to create Payment records (POST /api/payments route exists but no form)
- Dashboard charts are placeholder despite Chart.js being installed and stats data available
- Booking rejection reason modal missing (rejectionReason field exists in model and API)
- No cascading deletes when tenant is deleted (orphaned Payment/Complaint records)

Execution plan saved at: EXECUTION_PLAN.md
