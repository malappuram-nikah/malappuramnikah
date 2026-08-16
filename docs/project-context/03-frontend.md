# Frontend

The frontend lives in `mn-client/` and is a **Next.js 16 App Router** application using React 19 and TypeScript.

## Entry and configuration

| File | Purpose |
|------|---------|
| `src/app/layout.tsx` | Root HTML shell, DM Sans font, global CSS, Sonner toaster |
| `src/lib/config.ts` | Resolves `API_URL` from `NEXT_PUBLIC_API_URL` (fallback: `http://localhost:3333`) |
| `next.config.ts` | Empty configuration object |
| `tsconfig.json` | Path alias `@/*` → `src/*` |

## Routing (App Router)

There is **no `pages/` directory** and **no Next.js middleware** for authentication.

### Public routes

| Route | File | Notes |
|-------|------|-------|
| `/` | `src/app/page.tsx` | Landing: Navbar, hero, stats, features, CTA, `RegisterModal` |
| `/login` | `src/app/login/page.tsx` | Password login + WhatsApp OTP path |
| `/forgot-password` | `src/app/forgot-password/page.tsx` | Password reset flow |
| `/matches` | `src/app/matches/page.tsx` | Redirects logged-in users to `/dashboard/matches` |
| `/pricing` | `src/app/pricing/page.tsx` | Static pricing cards |
| `/success-stories` | `src/app/success-stories/page.tsx` | Hardcoded stories |
| `/admin/login` | `src/app/admin/login/page.tsx` | Admin login (OTP step mocked locally) |
| `/business/login` | `src/app/business/login/page.tsx` | Business portal login |
| `/business/register` | `src/app/business/register/page.tsx` | Business registration |
| `/save-the-date/demo-user-invitation` | `src/app/save-the-date/demo-user-invitation/page.tsx` | Demo invitation page |

**Missing routes:** Login UI links to `/terms` and `/privacy` but no route files exist.

### Dashboard routes (authenticated shell)

All routes under `/dashboard/*` share `src/app/dashboard/layout.tsx`, which wraps content with:

- `UserProvider` — loads current user from API
- `CompareProvider` — compare list (max 3 profiles)
- Sidebar + `DashboardHeader`
- `DashboardContentWrapper` → `VerificationWall`

| Route | File |
|-------|------|
| `/dashboard` | `dashboard/page.tsx` |
| `/dashboard/matches` | `dashboard/matches/page.tsx` — **"Coming soon" placeholder** |
| `/dashboard/search` | `dashboard/search/page.tsx` |
| `/dashboard/compare` | `dashboard/compare/page.tsx` |
| `/dashboard/interests` | `dashboard/interests/page.tsx` |
| `/dashboard/chat` | `dashboard/chat/page.tsx` |
| `/dashboard/my-profile` | `dashboard/my-profile/page.tsx` |
| `/dashboard/profile-builder` | `dashboard/profile-builder/page.tsx` |
| `/dashboard/profile/[id]` | `dashboard/profile/[id]/page.tsx` |
| `/dashboard/referral` | `dashboard/referral/page.tsx` |
| `/dashboard/premium` | `dashboard/premium/page.tsx` |
| `/dashboard/save-the-date` | `dashboard/save-the-date/page.tsx` |
| `/dashboard/settings` | `dashboard/settings/page.tsx` |
| `/dashboard/business` | `dashboard/business/page.tsx` |
| `/dashboard/admin` | `dashboard/admin/page.tsx` |
| `/dashboard/admin/referrals` | `dashboard/admin/referrals/page.tsx` |

## Component organization

```
src/components/
├── auth/           RegisterModal.tsx
├── dashboard/      Sidebar, Header, VerificationWall, ProfileSlideOver,
│                   CompareFloatingBar, BiodataDownload, IdentityVerificationForm, etc.
├── home/           HeroSection, StatsSection, FeaturesSection, CTASection, etc.
├── layout/         Navbar.tsx, Footer.tsx
├── profile-setup/  Wizard steps (BasicDetails, ReligiousInfo, ProfessionalInfo, …)
├── search/         FilterSidebar.tsx, FilterControls.tsx
└── ui/             button, badge, card, skeleton (Radix + CVA pattern)
```

**Orphan component:** `src/components/dashboard/AIMatchesLegacy.tsx` is not imported anywhere.

## API communication

### Pattern in use

Pages and components call **`fetch(`${API_URL}/...`)` directly**. They attach:

```typescript
Authorization: `Bearer ${localStorage.getItem("mn_token")}`
```

Login also sends `credentials: "include"` for httpOnly refresh cookie.

### Unused wrapper

`src/lib/apiClient.ts` defines a generic fetch wrapper with `get/post/put/patch/delete` and `ApiError` handling, but **no file imports it**.

## Auth on the client

| Storage key | Purpose |
|-------------|---------|
| `localStorage.mn_token` | JWT access token (primary auth) |
| `localStorage.mn_logged_in_user_id` | Cached user ID |
| `localStorage.mn_kyc_status` | Cached KYC status |
| `localStorage.mn_*_draft` | Profile wizard drafts (see [11-profile-system.md](./11-profile-system.md)) |
| Cookie `refresh_token` | Set by backend on login; cleared on sign-out |

Sign-out: `src/lib/auth.ts` → `handleSignOut()` clears all storage and redirects to `/login`.

**No server-side session.** Route protection is client-side via `VerificationWall` and per-page token checks.

## Real-time (Socket.io)

Used in:

- `dashboard/chat/page.tsx` — `private_message` events
- `components/dashboard/DashboardHeader.tsx` — `notification` events

Client connects to `API_URL` and emits `join` with user ID on connect.

## Internationalization

Configured in `src/lib/i18n.ts` (English + Malayalam) with `src/locales/en|ml/translation.json`.

`I18nProvider` and `LanguageSwitcher` exist but are **not mounted** in `src/app/layout.tsx`. Most UI strings are hardcoded English.

## Styling

- Tailwind CSS 4 via `@tailwindcss/postcss`
- Framer Motion for animations
- Lucide React icons
- Brand colors referenced as `brand-*` in Tailwind classes

## Key dependencies

From `mn-client/package.json`: `next@16.2.6`, `react@19.2.4`, `socket.io-client`, `i18next`, `sonner`, `framer-motion`, `@radix-ui/react-slot`.

## Scripts

| Command | Action |
|---------|--------|
| `npm run dev` | `next dev` |
| `npm run build` | `next build` |
| `npm run start` | `next start` |
| `npm run lint` | `eslint` |

## Related documentation

- Auth flows: [06-authentication.md](./06-authentication.md)
- Client state: [09-caching-state.md](./09-caching-state.md)
- Profile wizard: [11-profile-system.md](./11-profile-system.md)
- API endpoints consumed: [08-api.md](./08-api.md)
