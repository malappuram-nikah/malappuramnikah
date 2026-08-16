# ID Verification (KYC)

Identity verification uses government-issued ID document upload, admin review, and a frontend access gate for male members.

## Status field

**Column:** `User.kyc_status` (default: `NOT_SUBMITTED`)

### Observed state transitions

```
NOT_SUBMITTED
    │ POST /user/kyc/submit
    ▼
PENDING
    │ POST /user/admin/kyc/:id/review (admin)
    ▼
UNDER_REVIEW
    ├─ POST /user/admin/kyc/:id/approve → VERIFIED
    └─ POST /user/admin/kyc/:id/reject  → REJECTED
```

Rejected users can resubmit — **Needs verification** for exact re-submit behavior and whether status resets to `PENDING`.

## Related User columns

| Column | Purpose |
|--------|---------|
| `kyc_document_type` | Selected document type string |
| `kyc_front_url` | Front image URL/path |
| `kyc_back_url` | Back image URL/path (optional for some doc types) |
| `kyc_rejected_reason` | Admin rejection reason |
| `kyc_submitted_at` | Submission timestamp |
| `kyc_verified_at` | Approval timestamp |

## Document types (accepted)

From `user.route.ts` KYC submit handler:

- Aadhaar
- Driving License
- Passport
- Voter ID
- National ID
- Other Government Issued ID

## User submission

### API

```
POST /user/kyc/submit
Authorization: Bearer <token>
Body: {
  document_type: string,
  front_base64: string,
  back_base64?: string
}
```

Constraints: max 5 MB, JPG/PNG/PDF.

Uses `MediaStorageService.uploadPrivateMedia()` for file persistence.

### Frontend entry points

| Location | Component |
|----------|-----------|
| Profile builder step 10 | `IdentityVerificationForm.tsx` in `profile-setup/` |
| Settings page | `/dashboard/settings` — KYC tab/section |

**Component state:** Reads `kyc_status`, document URLs, rejection reason from user API response.

### Document viewing

```
GET /user/kyc/document/:fileName
```

Authorized for document owner or admin. Serves file from storage — see path inconsistency in [10-file-storage.md](./10-file-storage.md).

## Admin review

| Action | Endpoint | Effect |
|--------|----------|--------|
| List requests | `GET /user/admin/kyc/requests?search=&status=` | Filterable queue |
| Start review | `POST /user/admin/kyc/:id/review` | → `UNDER_REVIEW` |
| Approve | `POST /user/admin/kyc/:id/approve` | → `VERIFIED`, sets `kyc_verified_at`; may trigger referral reward |
| Reject | `POST /user/admin/kyc/:id/reject` | Body `{ reason }` → `REJECTED` |

Admin UI: `/dashboard/admin?tab=kyc`

## Notifications

On KYC events, backend creates notifications and emits Socket.io events:

- `KYC_SUBMITTED`
- `KYC_APPROVED`
- `KYC_REJECTED`

Exact notification payload shape — **Needs verification** per route handler.

## Frontend verification wall

**File:** `mn-client/src/components/dashboard/VerificationWall.tsx`

| User | Rule |
|------|------|
| Male | Must have `kyc_status === "VERIFIED"` to access most dashboard pages |
| Male + `PENDING` or `UNDER_REVIEW` | Shown "under review" message; blocked from browsing |
| Female | No KYC wall in current implementation |
| Admin / business routes | Bypass wall |

Bypass paths (male, unverified): `/dashboard/settings`, `/dashboard/profile-builder`

Redirect target for incomplete KYC: `/dashboard/settings` ("Complete Identity Verification" button).

## Client-side KYC cache

`localStorage.mn_kyc_status` synced from `UserContext` on user fetch.

## Referral integration

If `ReferralSettings.reward_condition === "KYC"`, approving KYC may award referral points to referrer via admin approve handler — see `admin.route.ts` KYC approve logic.

## Aadhaar OTP (frontend reference)

Settings page may reference `POST /otp/verify-aadhaar` — **Needs verification** whether this backend endpoint exists.

## Related documentation

- File storage paths: [10-file-storage.md](./10-file-storage.md)
- RBAC (admin KYC access): [07-rbac.md](./07-rbac.md)
- Admin KYC UI: [12-admin.md](./12-admin.md)
- Known issues (path bug): [16-known-issues.md](./16-known-issues.md)
