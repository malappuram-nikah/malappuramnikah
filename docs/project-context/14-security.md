# Security

This document records security-relevant behavior **as implemented**, including known gaps. It is not a penetration test report.

## Authentication security

| Topic | Current state |
|-------|---------------|
| Password hashing | bcrypt via `bcryptjs` |
| Access token lifetime | 15 minutes |
| Refresh token | 7-day httpOnly cookie; **no refresh endpoint** |
| JWT secrets | Fallback to hardcoded strings if env vars unset (`jwt.config.ts`) |
| Admin login | **OTP not validated** — any request with mobile number gets admin JWT |
| Token in query string | `?token=` accepted — may leak via logs/referrer |

## Authorization

| Topic | Current state |
|-------|---------------|
| Admin roles | Hardcoded user IDs and phone numbers — not scalable or auditable |
| Same-gender profile block | Enforced in API |
| Chat access | Requires mutual accepted interest |
| Frontend route protection | Client-side only — no Next.js middleware |
| Admin pages | Accessible if user navigates to URL; API returns 403 for non-admins |

## Network and CORS

**File:** `mn-api/src/index.ts`

- CORS callback allows **all origins** (`callback(null, true)`)
- Socket.io CORS: `origin: "*"`
- Credentials enabled on CORS

## Data exposure

| Topic | Current state |
|-------|---------------|
| OTP in API response | Returned when `NODE_ENV !== "production"` |
| Request logging | Logs full `req.body` for non-sensitive paths (may include profile/KYC data) |
| KYC documents | Private upload intended; local path serving depends on correct path config |
| Premium search masking | Partial masking for non-premium — reduces data exposure |

## Input handling

| Topic | Current state |
|-------|---------------|
| JSON body limit | 50 MB (supports base64 media uploads) |
| KYC file validation | Size (5MB) and MIME type checks on submit |
| SQL injection | Mitigated by Prisma parameterized queries |

## Secrets and configuration

Documented in `.env.example`:

- `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`
- `DATABASE_URL`
- MSG91, Cloudinary (optional)

Used in code but **not in `.env.example`:**

- WhatsApp/Meta/UltraMsg credentials
- `APP_URL`

**Docker compose** sets only `DATABASE_URL`, `PORT`, `NODE_ENV` for API — JWT and external service secrets must be supplied separately.

## File storage security

| Topic | Current state |
|-------|---------------|
| Cloudinary KYC | `type: "authenticated"` on upload |
| Local KYC | Stored under `public/uploads/kyc/` — served only via authenticated endpoint (if paths align) |
| Public uploads | Served statically at `/uploads/*` without auth |

## Session and logout

Frontend `handleSignOut()` clears localStorage, sessionStorage, and expires cookies. No server-side token revocation list.

## Dependencies

Standard Express/Prisma/Next.js stack. No dedicated security middleware (helmet, rate limiting) observed in `index.ts`.

## Recommendations (documentation only — not implemented)

These are gaps for future work, not current features:

1. Validate admin OTP; remove hardcoded admin IDs
2. Add refresh token endpoint and rotation
3. Restrict CORS to known frontend origins
4. Remove JWT secret fallbacks in production
5. Add rate limiting on auth/OTP endpoints
6. Fix KYC local path inconsistency
7. Add Next.js middleware or server-side auth for dashboard routes
8. Redact sensitive fields from request logging

## Related documentation

- Auth details: [06-authentication.md](./06-authentication.md)
- RBAC: [07-rbac.md](./07-rbac.md)
- Known issues list: [16-known-issues.md](./16-known-issues.md)
