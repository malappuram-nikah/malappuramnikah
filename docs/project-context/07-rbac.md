# RBAC (Role-Based Access Control)

There is **no formal Role model** or centralized authorization middleware. Access control is implemented through ad hoc checks in route handlers and frontend gates.

## Admin identification

**Primary guard:** `adminGuard()` in `mn-api/src/interface/routes/admin.route.ts`

A user is treated as admin if **any** of the following is true:

| Condition | Source |
|-----------|--------|
| `userId === 2` | Hardcoded ID |
| `userId === 6` | Hardcoded ID |
| `profile_details.isAdmin === true` | User JSON column |
| `mobile_number === "+911212121212"` | Hardcoded number |
| `mobile_number === "+919876543210"` | Hardcoded number |

Admin JWT from `POST /user/admin/login` includes `{ role: "admin", isAdmin: true }` but route guards primarily re-check database fields, not JWT claims alone.

## Authorization patterns by area

### Profile viewing

**File:** `user.route.ts` — `GET /user/:id`

| Actor | Can view |
|-------|----------|
| Self | Always |
| Admin | Any profile |
| Other member | Opposite gender only |
| Same gender | **Blocked** (403) |

### Profile listing

**File:** `user.route.ts` — `GET /user/profiles`

Returns opposite-gender profiles for members. Admin sees all users.

### Interest expression

**File:** `interest.route.ts` — `POST /user/interest`

| Rule | Enforcement |
|------|-------------|
| Must be authenticated | JWT required |
| Cannot interest same gender | 403 if genders match |
| Cannot interest self | 400 |

### Chat access

**File:** `chat.route.ts`

Requires **mutual `ACCEPTED` interest** between sender and receiver for both history and send.

### Profile editing

**File:** `user.route.ts` — `PUT /user/:id/profile`

Owner or admin only.

### Premium toggle (self)

**File:** `user.route.ts` — `PUT /user/:id/premium`

Owner only.

### Premium toggle (admin)

**File:** `admin.route.ts` — `POST /user/admin/users/:id/toggle-premium`

Requires `adminGuard`.

### KYC document access

**File:** `user.route.ts` — `GET /user/kyc/document/:fileName`

Owner or admin only.

### Biodata download

**File:** `user.route.ts` — biodata endpoints

| Actor | Access |
|-------|--------|
| Self | Always |
| Other member | Requires `ACCEPTED` interest with target |
| Admin | Can access (bypass not explicitly coded — **Needs verification**) |

Global toggle: `GET /user/admin/biodata/settings` (public) — admin can disable biodata downloads platform-wide via `adminStore.json`.

### Search premium gating

**File:** `search.route.ts` / `SearchService`

Non-premium users may see masked last names and blurred photos. Exact masking rules are in search repository/service — **Needs verification** for all field-level rules.

## User account status

| Status | Effect |
|--------|--------|
| `in_active` | Cannot log in (login rejected) |
| `active` | Full member access (subject to KYC wall on frontend) |

Admin can approve/reject profiles via `POST /user/admin/users/:id/verify` with `{ action: "approve" | "reject" }`.

## Frontend access gates

### VerificationWall

**File:** `mn-client/src/components/dashboard/VerificationWall.tsx`

| Rule | Behavior |
|------|----------|
| No token + no user | Redirect to `/login` |
| Male + KYC not `VERIFIED` | Block dashboard except bypass paths |
| Bypass paths | `/dashboard/settings`, `/dashboard/profile-builder`, `/dashboard/admin/*`, `/dashboard/business/*` |
| Female users | No KYC wall (KYC optional for females in current UI) |
| Admin/business on admin paths | Bypass KYC wall |

### Admin dashboard

No separate server-side route protection on Next.js pages. Admin pages rely on API returning 403 if non-admin calls admin endpoints.

## Business user role

Frontend routes exist at `/business/login`, `/business/register`, `/dashboard/business`.

Backend business-specific authorization model: **Unknown**. Business hub appears to reuse admin store endpoints — see [12-admin.md](./12-admin.md).

## What is NOT implemented

- Database-backed roles/permissions table
- Permission middleware applied globally
- Server-side Next.js route protection
- Refresh token rotation or revocation list

## Related documentation

- Authentication: [06-authentication.md](./06-authentication.md)
- Admin features: [12-admin.md](./12-admin.md)
- KYC gate: [13-id-verification.md](./13-id-verification.md)
- Security gaps: [14-security.md](./14-security.md)
