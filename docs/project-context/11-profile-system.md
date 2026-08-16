# Profile System

Member profiles combine **structured User columns** with a flexible **`profile_details` JSON** object keyed by wizard draft names.

## Data model

### User table columns (profile-related)

| Field | Source |
|-------|--------|
| `profile_for`, `gender`, `first_name`, `last_name`, `cast`, `location`, `dob`, `email` | Set at registration; some editable in wizard |
| `profile_details` | JSON blob — all wizard step data |
| `search_preferences` | Saved search filters |
| `is_premium` | Premium flag (admin or self toggle) |
| `status` | Account activation state |

### profile_details draft keys

These keys are used consistently in frontend and stored in `User.profile_details`:

| Key | Wizard step | Component |
|-----|-------------|-----------|
| `mn_basic_details_draft` | 1. Basic Details | `BasicDetailsStep.tsx` |
| `mn_religious_info_draft` | 2. Religious Details | `ReligiousInfoStep.tsx` |
| `mn_professional_info_draft` | 3. Professional Details | `ProfessionalInfoStep.tsx` |
| `mn_family_details_draft` | 4. Family Details | `FamilyDetailsStep.tsx` |
| `mn_interests_draft` | 5. Interests & Hobbies | `InterestsStep.tsx` |
| `mn_habits_draft` | 6. Personal Habits | `HabitsStep.tsx` |
| `mn_partner_preferences_draft` | 7. Partner Preferences | `PartnerPreferencesStep.tsx` |
| `mn_profile_photos_draft` | 8. Profile Photos | `ProfilePhotosStep.tsx` |
| `mn_video_intro_draft` | 9. Video Introduction | **Needs verification** — step order in profile-builder |
| `mn_voice_intro_draft` | 10. Voice Introduction | `VoiceIntroStep.tsx` |

KYC is stored on User columns (`kyc_*`), not inside `profile_details`, though step 10 in the wizard uses `IdentityVerificationForm`.

## Profile builder flow

**Page:** `mn-client/src/app/dashboard/profile-builder/page.tsx`

12 steps (including completion screen):

1. Basic Details
2. Religious Details
3. Professional Details
4. Family Details
5. Interests & Hobbies
6. Personal Habits
7. Partner Preferences
8. Profile Photos
9. Voice Introduction (order per page source)
10. Identity Verification (KYC)
11. Final Review
12. Completion success screen

### Draft persistence

Each step component:

1. Reads from `localStorage` draft key on mount
2. Autosaves to localStorage with ~1s debounce
3. On login, `UserContext` syncs backend `profile_details` → localStorage

### Backend persistence

**Bulk submit:** `ReviewStep.tsx` sends all drafts:

```
PUT /user/:userId/profile
Body: { profile_details: { mn_basic_details_draft: {...}, ... } }
```

**Inline edits:** `my-profile/page.tsx` and `DashboardHeader.tsx` can PATCH individual draft keys via the same endpoint.

## Profile enrichment

**File:** `mn-client/src/lib/profile-utils.ts`

`getEnrichedProfile(user)` flattens `profile_details` drafts into a display object with computed fields:

- `profileId`: `MN-{100000 + user.id}`
- Age from `dob` or draft
- Avatar from primary photo in `mn_profile_photos_draft.photos`
- Merged basic, religious, professional, family, interests, habits, partner sections

Used across search, compare, profile views, and biodata.

## Profile completion tracking

**File:** `mn-client/src/components/dashboard/ProfileCompletionTracker.tsx`

Weighted checklist against draft keys:

| Section | Weight | Check |
|---------|--------|-------|
| Basic Details | 20% | height + maritalStatus |
| Religious Info | 15% | namaz + religiousness |
| Professional Info | 15% | highestEducation + profession |
| Family Details | 10% | familyStatus |
| Interests | 5% | non-empty object |
| Habits | 5% | non-empty object |
| Partner Preferences | 15% | non-empty object |
| Profile Photos | 10% | at least one photo |
| Voice Introduction | 5% | voice recorded |
| KYC | separate | `kyc_status === VERIFIED` |

Also: `getProfileCompletionStatus()` in `profile-utils.ts`.

## Profile viewing

| View | Route / component |
|------|-------------------|
| Own profile | `/dashboard/my-profile` |
| Other user | `/dashboard/profile/[id]` |
| Slide-over preview | `ProfileSlideOver.tsx` (dashboard home) |
| Search results | `/dashboard/search` |
| Compare | `/dashboard/compare` |

Backend enforces opposite-gender viewing (except admin/self). Photos may be blurred until interest is established (frontend logic in dashboard home).

## Biodata download

**Component:** `BiodataDownload.tsx`

Uses:

- `GET /user/biodata/check-permission/:targetId`
- `GET /user/biodata/download/:targetId` or POST variant

Access requires mutual accepted interest (or self). Global toggle from admin biodata settings.

## Registration → profile prefill

On registration, basic fields populate User columns. `UserContext` pre-populates `mn_basic_details_draft` and `mn_religious_info_draft` from signup data when loading user.

## Related documentation

- KYC step: [13-id-verification.md](./13-id-verification.md)
- File uploads for photos: [10-file-storage.md](./10-file-storage.md)
- API profile endpoint: [08-api.md](./08-api.md)
- Client drafts/cache: [09-caching-state.md](./09-caching-state.md)
