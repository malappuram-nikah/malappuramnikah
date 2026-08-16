# Admin System

Admin functionality spans a JSON-backed store for CMS/marketplace data and database-backed user/KYC/referral management.

## Access

### Login

| Layer | Path / endpoint |
|-------|-----------------|
| Frontend | `/admin/login` → `src/app/admin/login/page.tsx` |
| Backend | `POST /user/admin/login` |

Frontend step 1 (OTP send) is **mocked locally** with `setTimeout` — no API call.

Backend accepts `{ mobileNumber, otpCode }` but **does not validate OTP**. Returns admin JWT immediately.

### Authorization

`adminGuard()` in `admin.route.ts` — see [07-rbac.md](./07-rbac.md).

## Frontend admin UI

### Main command center

**Page:** `src/app/dashboard/admin/page.tsx`

Tab-driven SPA synced with URL query `?tab=`. Sidebar tabs observed in source:

| Tab key | Purpose |
|---------|---------|
| `analytics` | Dashboard stats |
| `users` | User list |
| `profiles` | Profile approval |
| `kyc` | KYC request queue |
| `vendors` | Wedding vendors (JSON store) |
| `templates` | Save-the-date / invitation templates |
| `bookings` | Bookings (JSON store) |
| `revenue` | Revenue estimates |
| `reports` | User reports |
| `subscriptions` | Subscription plan definitions |
| `cms` | Banner, FAQs, success stories |
| `biodata` | Biodata download settings + tracking |
| `music` | Background music settings |
| `feedbacks` | User feedback list |

Sidebar also references `complaints` and `plans` — whether these render dedicated tab content **Needs verification** (may be unimplemented nav items).

### Referral admin

**Page:** `src/app/dashboard/admin/referrals/page.tsx`

Separate page for referral settings, user stats, block codes, adjust points.

### Business hub

**Page:** `src/app/dashboard/business/page.tsx`

B2B wedding creator/vendor management. Reuses some admin store API endpoints — exact scope **Needs verification**.

## Backend admin API

All routes mounted at `/user/admin`. See [08-api.md](./08-api.md) for full list.

### Database-backed features

| Feature | Endpoints |
|---------|-----------|
| Dashboard stats | `GET /stats` — user counts from DB + revenue from JSON store |
| User management | `GET /users`, `POST /users/:id/verify`, `POST /users/:id/toggle-premium` |
| KYC review | `GET /kyc/requests`, `POST /kyc/:id/review|approve|reject` |
| Referrals | `/referrals/*` — settings, list, block, points adjustment |
| Feedback | `GET /feedback`, `DELETE /feedback/:id` |

### JSON store (`adminStore.json`)

**File:** `mn-api/src/infrastructure/data/adminStore.json`

Read/written by `getAdminStore()` / `saveAdminStore()` in `admin.route.ts`.

Default structure when missing:

```json
{
  "vendors": [],
  "bookings": [],
  "templates_save_the_date": [],
  "templates_wedding_invitation": [],
  "reports": [],
  "subscriptions": [],
  "cms": {},
  "activity_logs": []
}
```

Additional keys used at runtime (from route handlers):

- Biodata download settings and tracking
- Background music settings and track URL
- Revenue/subscription plan data for analytics

Updated via `POST /user/admin/store/update` with section-specific body payloads.

### Public admin settings endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /user/admin/biodata/settings` | Whether biodata download is enabled globally |
| `GET /user/admin/music/settings` | Ambient music URL/settings for dashboard header player |

These do not require admin auth.

### Biodata tracking

`POST /user/admin/biodata/track` — any authenticated user can track their own biodata download event (stored in adminStore).

## Admin notifications

KYC approve/reject and other admin actions create `Notification` records and emit Socket.io `notification` events.

## KYC admin workflow

See [13-id-verification.md](./13-id-verification.md) for the full KYC state machine.

Brief flow:

1. `GET /kyc/requests` — list with search/status filters
2. `POST /kyc/:id/review` — mark `UNDER_REVIEW`
3. `POST /kyc/:id/approve` — set `VERIFIED`; may award referral points if `reward_condition === "KYC"`
4. `POST /kyc/:id/reject` — set `REJECTED` with reason

## Profile approval (separate from KYC)

`POST /user/admin/users/:id/verify` with `{ action: "approve" | "reject" }` sets User `status`. This is distinct from KYC verification status.

**Needs verification:** Relationship between profile approval and member dashboard access beyond login `active` status.

## Related documentation

- RBAC: [07-rbac.md](./07-rbac.md)
- KYC: [13-id-verification.md](./13-id-verification.md)
- API reference: [08-api.md](./08-api.md)
- Security concerns: [14-security.md](./14-security.md)
