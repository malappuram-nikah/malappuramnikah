# Current Features

Feature inventory based on implemented routes and pages. Status reflects code as of repository analysis — not product roadmap.

## Legend

| Status | Meaning |
|--------|---------|
| **Live** | Backend + frontend implemented and wired |
| **Partial** | UI or API exists but incomplete |
| **Placeholder** | Page exists with stub/coming-soon content |
| **Backend only** | API exists; no or minimal frontend |
| **Frontend only** | UI exists; no payment/backend persistence |

---

## Authentication and account

| Feature | Status | Notes |
|---------|--------|-------|
| Registration (mobile + password) | Live | `RegisterModal` → `/user/register` |
| WhatsApp OTP verification | Live | UltraMsg / Meta / dev fallback |
| Login (password) | Live | JWT + refresh cookie |
| Forgot / reset password | Live | WhatsApp OTP via separate verify flow |
| Account deletion | Live | `DELETE /user/:id` |
| Guest referral code generation | Live | Pre-registration |

## Profile

| Feature | Status | Notes |
|---------|--------|-------|
| 12-step profile builder | Live | localStorage drafts + bulk API save |
| My profile view/edit | Live | `/dashboard/my-profile` |
| Profile completion tracker | Live | Weighted % on dashboard |
| Profile photos | Live | Base64/Cloudinary in JSON |
| Voice introduction | Live | Draft + upload |
| Video introduction | Partial | Draft key exists; step order **Needs verification** |
| Biodata download | Live | Interest-gated; admin global toggle |
| Partner preferences | Live | Used in compare feature |

## Discovery and matching

| Feature | Status | Notes |
|---------|--------|-------|
| Suggested profiles (dashboard) | Live | `GET /user/profiles` |
| Advanced search + filters | Live | `/dashboard/search` |
| Save search preferences | Live | `PUT /search/preferences` |
| Profile compare (up to 3) | Live | `/dashboard/compare` |
| AI matches | Placeholder | `/dashboard/matches` — "Coming soon" |
| AIMatchesLegacy component | Unused | Orphan file |

## Social / engagement

| Feature | Status | Notes |
|---------|--------|-------|
| Express interest | Live | Toggle + mutual auto-accept |
| Interest tabs (sent/received/mutual/viewed/visited) | Live | `/dashboard/interests` |
| Favourites | Live | Toggle + list |
| Block users | Live | Toggle + list |
| Profile views tracking | Live | `ProfileView` model + interest API types |
| Chat (mutual matches) | Live | REST + Socket.io |
| Notifications | Live | REST + Socket.io in header |
| Feedback submission | Live | Settings + admin list |

## Identity verification

| Feature | Status | Notes |
|---------|--------|-------|
| KYC document upload | Live | Male verification wall enforced |
| Admin KYC review queue | Live | Approve/reject workflow |
| Female KYC | Partial | Optional — no verification wall |

## Premium and monetization

| Feature | Status | Notes |
|---------|--------|-------|
| Premium flag (`is_premium`) | Live | Admin toggle + self endpoint |
| Search result masking (non-premium) | Partial | Backend search service |
| Premium plans page | Frontend only | `/dashboard/premium` — no payment API |
| Pricing page (public) | Frontend only | Static cards |
| Subscription management (admin) | Partial | Plans in adminStore JSON |

## Referrals

| Feature | Status | Notes |
|---------|--------|-------|
| Referral codes | Live | On User model |
| Points earn/redeem | Live | `/dashboard/referral` |
| Admin referral management | Live | Settings, block, adjust points |
| Reward on KYC approval | Live | When `reward_condition === "KYC"` |

## Admin and CMS

| Feature | Status | Notes |
|---------|--------|-------|
| Admin command center | Live | Tabbed SPA at `/dashboard/admin` |
| User management | Live | List, verify, premium toggle |
| Analytics dashboard | Live | DB + JSON store stats |
| CMS (banner, FAQs, stories) | Live | adminStore JSON |
| Wedding vendors | Live | adminStore JSON |
| Bookings | Live | adminStore JSON |
| Save-the-date templates | Live | adminStore JSON |
| Wedding invitation templates | Live | adminStore JSON |
| User reports/complaints | Partial | In adminStore; UI tab **Needs verification** |
| Biodata download admin settings | Live | Enable/disable + tracking |
| Background music player | Live | Admin upload + dashboard header player |
| Feedback moderation | Live | List + delete |

## Business portal

| Feature | Status | Notes |
|---------|--------|-------|
| Business login/register pages | Live | Frontend routes |
| Business dashboard | Partial | `/dashboard/business` — scope **Needs verification** |

## Save the date / invitations

| Feature | Status | Notes |
|---------|--------|-------|
| Save-the-date creator | Partial | `/dashboard/save-the-date` — local state |
| Demo invitation page | Live | `/save-the-date/demo-user-invitation` |
| Template persistence to backend | Unknown | **Needs verification** |

## Internationalization

| Feature | Status | Notes |
|---------|--------|-------|
| English / Malayalam translations | Partial | JSON files exist; provider not mounted |
| Language switcher | Partial | Component exists; not in layout |

## Public marketing pages

| Feature | Status | Notes |
|---------|--------|-------|
| Landing page | Live | `/` |
| Success stories | Live | Hardcoded content |
| Public matches redirect | Live | `/matches` |
| Terms / Privacy pages | Missing | Linked from login but no routes |

## Real-time

| Feature | Status | Notes |
|---------|--------|-------|
| Online user tracking | Live | In-memory Set (server) |
| Live chat messages | Live | Socket.io |
| Live notifications | Live | Socket.io |

## Related documentation

- Known gaps: [16-known-issues.md](./16-known-issues.md)
- API endpoints: [08-api.md](./08-api.md)
- Frontend routes: [03-frontend.md](./03-frontend.md)
