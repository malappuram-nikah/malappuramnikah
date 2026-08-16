# Authentication

Authentication spans JWT tokens, OTP verification, and bcrypt password hashing. There is **no OAuth** or third-party identity provider in the current codebase.

## Token configuration

**File:** `mn-api/src/infrastructure/config/jwt.config.ts`

| Token | Secret env var | Expiry | Payload |
|-------|----------------|--------|---------|
| Access | `ACCESS_TOKEN_SECRET` (fallback: hardcoded string) | 15 minutes | `{ userId }` |
| Refresh | `REFRESH_TOKEN_SECRET` (fallback: hardcoded string) | 7 days | `{ userId }` |

**Service:** `mn-api/src/infrastructure/service/AuthService.service.ts` — `generateToken`, `verifyToken`, `decodeToken`.

Note: `.env.example` documents `JWT_SECRET` but it is **not referenced in code**.

## Registration flow

```
Client                          API
  │ POST /user/register           │
  │──────────────────────────────▶│ RegisterUser use case
  │                               │ → creates User (status: in_active)
  │                               │ → SendOtpUseCase
  │                               │ → stores OTP in Verify table
  │                               │ → sends OTP via WhatsappOtpService
  │◀──────────────────────────────│
  │ POST /otp/verify-otp          │
  │ { phoneNumber, otpCode }      │
  │──────────────────────────────▶│ VerifyOtp use case
  │                               │ → validates OTP (8 min expiry)
  │                               │ → sets status: "active"
  │◀ accessToken ─────────────────│
```

### OTP delivery

**File:** `mn-api/src/infrastructure/service/WhatsappOtpService.ts`

Fallback chain:

1. UltraMsg API (`ULTRAMSG_INSTANCE_ID`, `ULTRAMSG_TOKEN`)
2. Meta WhatsApp Cloud API (`META_WA_ACCESS_TOKEN`, `META_WA_PHONE_NUMBER_ID`, etc.)
3. Dev console log (non-production)

**MSG91** (`Msg91Service.ts`) exists but is **not used** in the registration OTP path.

### Dev behavior

When `NODE_ENV !== "production"`, OTP may be returned in the API response (see `otp.route.ts` / resend-otp handler).

## Login flow

**Endpoint:** `POST /user/login`

**Use case:** `LoginUser.usecase.ts`

1. Find user by `mobile_number`
2. Reject if `status === "in_active"` (unverified account)
3. Compare password with bcrypt
4. Return access JWT in JSON body: `{ token: "..." }`
5. Set `refresh_token` httpOnly cookie (7 days, `secure` in production)

**Frontend:** Stores access token in `localStorage.mn_token`. Sends `credentials: "include"` on login.

### Refresh token

Refresh token is issued and stored in a cookie, but **no API endpoint exists** to exchange it for a new access token. When the 15-minute access token expires, the user must log in again unless the frontend implements silent refresh (it does not currently).

## OTP resend

**Endpoint:** `POST /otp/resend-otp`

Body: `{ phoneNumber }`. Delegates to `SendOtpUseCase`.

## Password reset

Separate from registration OTP:

1. `POST /user/forgot-password` — creates `Verify` record (15 min expiry), sends WhatsApp OTP
2. `POST /user/reset-password` — validates OTP from `verify` table, bcrypt-hashes new password

Implemented inline in `user.route.ts`, not via use cases.

## Admin login

**Endpoint:** `POST /user/admin/login`

**Frontend:** `/admin/login` — step 1 OTP send is **mocked locally** (setTimeout, no API call).

**Backend:** Accepts `{ mobileNumber, otpCode }` but **`otpCode` is not validated**. Returns admin JWT with payload `{ userId, role: "admin", isAdmin: true }`.

## Client-side auth

| Mechanism | Location |
|-----------|----------|
| Token storage | `localStorage.mn_token` |
| User ID decode | Client decodes JWT payload via `atob(token.split('.')[1])` |
| Sign out | `mn-client/src/lib/auth.ts` → clears storage + cookies, redirects to `/login` |
| Route guard | `VerificationWall` + per-page token checks (no Next.js middleware) |

## JWT extraction on API requests

**Function:** `getUserIdFromRequest(req)` in `interest.route.ts`

Supports:

- Header: `Authorization: Bearer <token>`
- Query: `?token=<token>`

Used across protected routes for authorization.

## Account deletion

**Endpoint:** `DELETE /user/:id`

Allowed for self or admin. **Needs verification** for cascade behavior on related records (Prisma `onDelete: Cascade` is set on most relations).

## Related documentation

- RBAC after auth: [07-rbac.md](./07-rbac.md)
- Security concerns: [14-security.md](./14-security.md)
- Frontend login page: [03-frontend.md](./03-frontend.md)
