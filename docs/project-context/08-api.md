# API Reference

Base URL: `http://localhost:3333` (or `NEXT_PUBLIC_API_URL` / `PORT` env).

**Auth legend:** None | JWT (`Authorization: Bearer`) | Admin (JWT + `adminGuard`)

JWT extraction also accepts `?token=` query parameter via `getUserIdFromRequest()`.

---

## Static

| Method | Path | Auth |
|--------|------|------|
| GET | `/uploads/*` | None — serves `public/uploads/` |

---

## OTP — mount `/otp`

| Method | Path | Auth | Body / notes |
|--------|------|------|--------------|
| POST | `/otp/resend-otp` | None | `{ phoneNumber }` |
| POST | `/otp/verify-otp` | None | `{ phoneNumber, otpCode, userId? }` → returns `accessToken`, sets user `active` |

---

## User — mount `/user`

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/user/register` | None | Creates user, sends OTP |
| POST | `/user/generate-referral-code` | None | Guest referral code |
| POST | `/user/login` | None | Returns JWT; sets `refresh_token` cookie |
| GET | `/user/profiles` | JWT | Opposite-gender list (admin: all) |
| PUT | `/user/:id/profile` | JWT | Owner or admin; body `{ profile_details }` |
| GET | `/user/:id` | JWT | Profile view; same-gender blocked unless admin/self |
| PUT | `/user/:id/premium` | JWT | Owner only |
| POST | `/user/kyc/submit` | JWT | `{ document_type, front_base64, back_base64? }` |
| GET | `/user/kyc/document/:fileName` | JWT | Owner or admin |
| DELETE | `/user/:id` | JWT | Self or admin |
| POST | `/user/block` | JWT | Toggle block `{ blocked_id }` |
| GET | `/user/block` | JWT | List blocked user IDs |
| POST | `/user/favourite` | JWT | Toggle favourite `{ favourited_id }` |
| GET | `/user/favourite` | JWT | Favourites + blocked IDs |
| POST | `/user/feedback` | JWT | `{ category, rating, subject, message }` |
| POST | `/user/forgot-password` | None | Sends WhatsApp OTP |
| POST | `/user/reset-password` | None | `{ mobile_number, otpCode, newPassword }` |
| GET | `/user/biodata/check-permission/:targetId` | JWT | Interest-based access check |
| GET | `/user/biodata/download/:targetId` | JWT | Download if permitted |
| POST | `/user/biodata/download` | JWT | Body `{ targetId }` |

---

## Interest — mount `/user/interest`

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/user/interest` | JWT | Body `{ receiver_id }` — toggle/express; mutual → `ACCEPTED` |
| GET | `/user/interest` | JWT | Query: `type` (`sent`, `received`, `mutual`, `viewed_me`, `visited`), `page`, `limit`, `idsOnly=true` |

---

## Chat — mount `/user/chat`

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/user/chat/history/:peerId` | JWT | Requires mutual `ACCEPTED` interest |
| POST | `/user/chat/message` | JWT | Body `{ receiver_id, content }`; emits Socket.io event |

---

## Notifications — mount `/user/notifications`

| Method | Path | Auth |
|--------|------|------|
| GET | `/user/notifications` | JWT |
| PUT | `/user/notifications/read-all` | JWT |
| PUT | `/user/notifications/:id/read` | JWT |

---

## Search — mount `/search`

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/search/profiles` | JWT | Query filters (age, location, education, etc.); premium masking |
| POST | `/search/preferences` | JWT | Body `{ preferences }` |

---

## Referral — mount `/referral`

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/referral/validate` | Optional JWT | Validate referral code |
| GET | `/referral/me` | JWT | Code, points, stats |
| GET | `/referral/history` | JWT | Paginated |
| GET | `/referral/transactions` | JWT | Paginated |
| POST | `/referral/redeem` | JWT | Body `{ points }` |

---

## Admin — mount `/user/admin`

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/user/admin/login` | None | **OTP not validated**; returns admin JWT |
| GET | `/user/admin/stats` | Admin | DB counts + adminStore stats |
| GET | `/user/admin/users` | Admin | All users |
| POST | `/user/admin/users/:id/verify` | Admin | `{ action: "approve" \| "reject" }` |
| POST | `/user/admin/users/:id/toggle-premium` | Admin | Toggle `is_premium` |
| GET | `/user/admin/store` | Admin | Read adminStore.json |
| POST | `/user/admin/store/update` | Admin | Update vendors, bookings, templates, CMS, etc. |
| POST | `/user/admin/biodata/track` | JWT | Any user tracks own biodata download |
| GET | `/user/admin/biodata/settings` | None | Public biodata toggle |
| GET | `/user/admin/music/settings` | None | Public music settings |
| GET | `/user/admin/kyc/requests` | Admin | Query: `search`, `status` |
| POST | `/user/admin/kyc/:id/review` | Admin | `PENDING` → `UNDER_REVIEW` |
| POST | `/user/admin/kyc/:id/approve` | Admin | → `VERIFIED`; may trigger referral reward |
| POST | `/user/admin/kyc/:id/reject` | Admin | Body `{ reason }` → `REJECTED` |
| GET | `/user/admin/referrals` | Admin | Paginated list + stats |
| GET | `/user/admin/referrals/settings` | Admin | |
| POST | `/user/admin/referrals/settings` | Admin | Update settings |
| GET | `/user/admin/referrals/:id` | Admin | User referral detail |
| PATCH | `/user/admin/referrals/block` | Admin | Block/unblock referral code |
| PATCH | `/user/admin/referrals/points` | Admin | Bonus/deduct points |
| GET | `/user/admin/feedback` | Admin | All feedback |
| DELETE | `/user/admin/feedback/:id` | Admin | Delete feedback |

---

## Socket.io (same host/port as HTTP)

| Event | Direction | Payload |
|-------|-----------|---------|
| `join` | Client → Server | `userId` (number or string) |
| `private_message` | Server → Client | Message object |
| `notification` | Server → Client | Notification object |
| `interest_match` | Server → Client | Match notification |

---

## Response patterns

Most endpoints return JSON with `{ success: boolean, message?: string, ...data }`. Exact shapes vary by endpoint — inspect route handlers for field names.

HTTP status codes observed: `200`, `400`, `401`, `403`, `404`, `500`.

---

## Endpoints referenced by frontend but not confirmed in backend routes

| Frontend reference | Status |
|--------------------|--------|
| `POST /otp/verify-aadhaar` | **Needs verification** — grep backend routes |

---

## Related documentation

- Backend architecture: [04-backend.md](./04-backend.md)
- Auth details: [06-authentication.md](./06-authentication.md)
- RBAC rules: [07-rbac.md](./07-rbac.md)
