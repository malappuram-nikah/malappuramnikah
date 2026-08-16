# Database

The backend uses **PostgreSQL** via **Prisma 6**. Schema file: `mn-api/prisma/schema.prisma`.

Connection string: `DATABASE_URL` environment variable.

## Models overview

| Model | Table | Purpose |
|-------|-------|---------|
| User | `user` | Core member account and profile |
| Verify | `verify` | OTP records for verification and password reset |
| Interest | `interest` | Sent/received interest with status |
| Message | `message` | Chat messages between matched users |
| Notification | `notification` | In-app notifications (no Prisma FK to User) |
| Referral | `referral` | Referrer → referred user link |
| ReferralTransaction | `referral_transaction` | Points ledger entries |
| ReferralSettings | `referral_settings` | Singleton config (id = 1) |
| Block | `block` | User block list |
| Favourite | `favourite` | User favourites |
| Feedback | `feedback` | User-submitted feedback |
| ProfileView | `profile_view` | Who viewed whose profile |

## User model (key fields)

```prisma
// mn-api/prisma/schema.prisma (abbreviated)
model User {
  id              Int       @id @default(autoincrement())
  uuid            String?   @unique
  profile_for     String
  gender          String
  first_name      String
  last_name       String
  cast            String
  location        String
  email           String?   @unique
  mobile_number   String    @unique
  password        String    // bcrypt hashed
  dob             String
  status          String    @default("in_active")
  is_premium      Boolean   @default(false)
  is_new_user     Boolean   @default(true)
  profile_details Json?     // Nested wizard drafts (see 11-profile-system.md)
  search_preferences Json?
  kyc_status      String    @default("NOT_SUBMITTED")
  kyc_document_type, kyc_front_url, kyc_back_url, kyc_rejected_reason
  kyc_submitted_at, kyc_verified_at
  referral_code   String?   @unique
  referral_points Int       @default(0)
  // ... relations
}
```

### User status values (from code)

| Value | Meaning |
|-------|---------|
| `in_active` | Registered, pending OTP verification (default) |
| `active` | OTP verified or admin-approved |

### KYC status values (from code)

`NOT_SUBMITTED` → `PENDING` → `UNDER_REVIEW` → `VERIFIED` or `REJECTED`

## JSON columns

### `profile_details`

Stores nested objects keyed by frontend draft names, e.g.:

- `mn_basic_details_draft`
- `mn_religious_info_draft`
- `mn_professional_info_draft`
- `mn_family_details_draft`
- `mn_interests_draft`
- `mn_habits_draft`
- `mn_partner_preferences_draft`
- `mn_profile_photos_draft`
- `mn_video_intro_draft`
- `mn_voice_intro_draft`

May also contain `isAdmin: true` for admin flag (used in RBAC).

### `search_preferences`

Persisted search filter preferences from `PUT /search/preferences`.

## Relationships

```
User 1──N Verify
User 1──N Interest (as sender via SentInterests)
User 1──N Interest (as receiver via ReceivedInterests)
User 1──N Message (sent / received)
User 1──N Referral (as referrer)
User 1──1 Referral (as referred_user, unique)
User 1──N ReferralTransaction
User 1──N Block (blocker / blocked)
User 1──N Favourite (favouriter / favourited)
User 1──N Feedback
User 1──N ProfileView (viewer / viewed)
Referral 1──N ReferralTransaction
```

## Interest model

| Field | Values |
|-------|--------|
| `status` | `PENDING`, `ACCEPTED`, `REJECTED` |
| Unique constraint | `[sender_id, receiver_id]` |

Mutual match logic: when both users express interest, status becomes `ACCEPTED`.

## Notification model

Stores `user_id` and `sender_id` as integers **without Prisma relations** to `User`. Referential integrity is not enforced at the ORM level.

Observed `type` values in code comments: `INTEREST_SENT`, `INTEREST_ACCEPTED`, `NEW_MESSAGE`, plus KYC types (`KYC_SUBMITTED`, `KYC_APPROVED`, `KYC_REJECTED`).

## Referral settings (singleton)

`ReferralSettings` row with `id = 1`:

| Field | Default |
|-------|---------|
| `points_per_referral` | 100 |
| `reward_condition` | `SIGNUP` (also: `KYC`, `PAYMENT`) |
| `enabled` | true |
| `max_referral` | 100 |
| `daily_limit` | 10 |

## Migrations

Located in `mn-api/prisma/migrations/`. Notable migrations:

| Migration | Change |
|-----------|--------|
| `20250124062659_init` | Initial schema |
| `20250124062933_init` | Schema adjustments |
| `20250127200812_add_mobile_number_unique_constraint` | Unique mobile |
| `20250129191231_unitail_migration` | Schema update |
| `20250131084722_` | Additional changes |

Run migrations manually: `npx prisma migrate deploy` (from `mn-api/`). **Not automated** in Docker startup.

## Data outside PostgreSQL

| Data | Location |
|------|----------|
| Admin CMS, vendors, bookings, templates | `mn-api/src/infrastructure/data/adminStore.json` |
| Local media uploads | `mn-api/public/uploads/` |
| KYC files (local) | **Path inconsistency** — see [10-file-storage.md](./10-file-storage.md) |

## Related documentation

- API that reads/writes these models: [08-api.md](./08-api.md)
- Profile JSON structure: [11-profile-system.md](./11-profile-system.md)
- Referral admin: [12-admin.md](./12-admin.md)
