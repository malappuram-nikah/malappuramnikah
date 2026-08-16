# Caching and State Management

This document covers how state is stored and cached across the backend and frontend.

## Backend

### Redis

**File:** `mn-api/src/infrastructure/config/redis.config.ts`

- Creates `new Redis()` from `ioredis` with default localhost connection
- **Not imported or used anywhere else in the codebase**
- OTP is stored in PostgreSQL `verify` table, not Redis
- No HTTP response caching layer

**Status:** Configured dependency only; no active caching.

### In-memory online users

**File:** `mn-api/src/infrastructure/onlineTracker.ts`

```typescript
export const onlineUsers = new Set<number>();
```

Updated on Socket.io `join` / `disconnect` in `src/index.ts`. Lost on server restart. Not shared across multiple API instances.

### Admin store (file-backed state)

**File:** `mn-api/src/infrastructure/data/adminStore.json`

Read synchronously via `fs.readFileSync` and written on admin updates. Not cached in memory beyond the request lifecycle (re-read each call to `getAdminStore()`).

**Needs verification:** Whether concurrent writes could corrupt the JSON file under load.

---

## Frontend

### React Context

| Context | File | Scope | Data |
|---------|------|-------|------|
| UserContext | `src/context/UserContext.tsx` | Dashboard layout | `currentUser`, `loadingUser`, `refreshUser()` |
| CompareContext | `src/context/CompareContext.tsx` | Dashboard layout | Up to 3 profile IDs for compare feature |

**UserContext behavior:**

1. On mount: read `mn_token` → decode `userId` → `GET /user/:userId`
2. Syncs `user.profile_details` keys into `localStorage` drafts
3. Sets `mn_kyc_status`, `mn_logged_in_user_id`
4. Clears drafts when logged-in user changes

**CompareContext behavior:**

- Stores compare list per user in localStorage
- Max 3 profiles

### localStorage keys (confirmed)

| Key pattern | Purpose |
|-------------|---------|
| `mn_token` | JWT access token |
| `mn_logged_in_user_id` | Cached user ID |
| `mn_kyc_status` | Cached KYC status |
| `mn_basic_details_draft` | Profile wizard draft |
| `mn_religious_info_draft` | Profile wizard draft |
| `mn_professional_info_draft` | Profile wizard draft |
| `mn_family_details_draft` | Profile wizard draft |
| `mn_interests_draft` | Profile wizard draft |
| `mn_habits_draft` | Profile wizard draft |
| `mn_partner_preferences_draft` | Profile wizard draft |
| `mn_profile_photos_draft` | Profile wizard draft |
| `mn_video_intro_draft` | Profile wizard draft |
| `mn_voice_intro_draft` | Profile wizard draft |
| `mn_compare_ids_{userId}` | Compare list for logged-in user |
| `mn_compare_ids_guest` | Compare list when no user loaded |

Draft autosave: 1-second debounce in profile-setup step components.

### sessionStorage

Cleared on sign-out via `handleSignOut()`. Usage per-page — **Needs verification** for specific keys.

### Component-level state

Primary data fetching pattern:

```typescript
const [data, setData] = useState(...);
useEffect(() => { fetch(...).then(...) }, []);
```

No global data cache. Pages refetch on mount. `refreshUser()` from UserContext is the main cross-page invalidation mechanism for user data.

### Libraries NOT used

- Redux / Zustand
- React Query / SWR / TanStack Query
- Next.js server component caching (most pages are `"use client"`)
- The unused `apiClient.ts` wrapper

### Real-time state

Socket.io connections in chat and dashboard header update UI on incoming events without polling. Connection state is component-local, not global.

### i18n language preference

`i18next-browser-languagedetector` caches language in localStorage when i18n is active. Currently i18n provider is not mounted — detector may not run.

---

## Cross-cutting concerns

| Concern | Current approach |
|---------|------------------|
| Token expiry (15m) | No silent refresh; user re-authenticates |
| Stale profile data | Manual `refreshUser()` or page remount |
| Multi-tab sync | No `storage` event listeners observed — **Needs verification** |
| Offline support | None |

## Related documentation

- Frontend context usage: [03-frontend.md](./03-frontend.md)
- Profile drafts: [11-profile-system.md](./11-profile-system.md)
- Auth token storage: [06-authentication.md](./06-authentication.md)
