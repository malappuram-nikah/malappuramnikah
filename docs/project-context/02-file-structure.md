# File Structure

This document maps the repository layout as it exists today. Paths are relative to the repo root unless noted.

## Top level

```
malappuramnikah/
├── README.md                 # Project name only (1 line)
├── docker-compose.yml        # postgres + mn-api + mn-client
├── docs/
│   └── project-context/      # This documentation set
├── mn-api/                   # Backend API
└── mn-client/                # Frontend web app
```

## Backend (`mn-api/`)

```
mn-api/
├── Dockerfile
├── package.json
├── .env.example
├── prisma/
│   ├── schema.prisma         # All DB models
│   └── migrations/           # Timestamped SQL migrations
├── src/
│   ├── index.ts              # Express + Socket.io entry point
│   ├── check.ts              # Utility/diagnostic (not mounted as route)
│   ├── domain/
│   │   ├── entities/         # user.interface.ts, otp.interface.ts
│   │   └── interfaces/       # IUserRepository, IOtpRepository
│   ├── applications/         # Note: plural
│   │   ├── dto/              # LoginResponse.ts
│   │   └── use-cases/
│   │       ├── index.ts
│   │       └── user/         # Register, Login, OTP, profile, referral use cases
│   ├── application/          # Note: singular (typo/inconsistency)
│   │   └── services/
│   │       └── SearchService.ts
│   ├── infrastructure/
│   │   ├── config/
│   │   │   ├── jwt.config.ts
│   │   │   └── redis.config.ts   # Unused
│   │   ├── prisma/
│   │   │   └── prisamClient.ts     # Prisma client singleton (typo in filename)
│   │   ├── repositories/
│   │   │   ├── UserRepository.ts
│   │   │   └── OtpRepository.ts
│   │   ├── database/
│   │   │   └── SearchRepository.ts
│   │   ├── service/
│   │   │   ├── AuthService.service.ts
│   │   │   ├── MediaStorageService.ts
│   │   │   ├── WhatsappOtpService.ts
│   │   │   └── Msg91Service.ts     # Unused in OTP flow
│   │   ├── data/
│   │   │   └── adminStore.json     # JSON-backed admin/CMS data
│   │   └── onlineTracker.ts        # In-memory Set of online user IDs
│   └── interface/
│       ├── routes/           # Express routers (8 files)
│       │   ├── user.route.ts
│       │   ├── otp.route.ts
│       │   ├── interest.route.ts   # Also exports getUserIdFromRequest()
│       │   ├── chat.route.ts
│       │   ├── notification.route.ts
│       │   ├── admin.route.ts
│       │   ├── referral.route.ts
│       │   └── search.route.ts
│       └── controllers/
│           ├── user.controller.ts
│           ├── otp.controller.ts
│           └── search.controller.ts
├── test-db.js                # Ad-hoc DB test script
└── test-prisma.ts            # Ad-hoc Prisma test script
```

### Route mount points (from `src/index.ts`)

| Mount prefix | Route file |
|--------------|------------|
| `/user/interest` | `interest.route.ts` |
| `/user/chat` | `chat.route.ts` |
| `/user/notifications` | `notification.route.ts` |
| `/user/admin` | `admin.route.ts` |
| `/referral` | `referral.route.ts` |
| `/user` | `user.route.ts` |
| `/otp` | `otp.route.ts` |
| `/search` | `search.route.ts` |
| `/uploads` | Static files from `public/uploads/` |

## Frontend (`mn-client/`)

```
mn-client/
├── Dockerfile
├── package.json              # name: "mn-web"
├── next.config.ts            # Empty config object
├── tsconfig.json             # @/* → src/*
├── postcss.config.mjs
├── public/                   # Static assets (SVG icons)
└── src/
    ├── app/                  # Next.js App Router pages
    │   ├── layout.tsx        # Root layout
    │   ├── page.tsx          # Landing page
    │   ├── globals.css
    │   ├── login/
    │   ├── forgot-password/
    │   ├── admin/login/
    │   ├── business/login/ & register/
    │   ├── matches/, pricing/, success-stories/
    │   ├── save-the-date/demo-user-invitation/
    │   └── dashboard/        # Authenticated member area
    │       ├── layout.tsx
    │       ├── page.tsx
    │       ├── search/, compare/, interests/, chat/
    │       ├── my-profile/, profile-builder/, profile/[id]/
    │       ├── referral/, premium/, settings/
    │       ├── save-the-date/, business/
    │       ├── matches/      # Placeholder
    │       └── admin/        # Admin command center + referrals
    ├── components/
    │   ├── auth/             # RegisterModal
    │   ├── dashboard/        # Sidebar, header, verification, compare bar, etc.
    │   ├── home/             # Landing sections
    │   ├── layout/           # Navbar, Footer
    │   ├── profile-setup/    # Wizard step components
    │   ├── search/           # FilterSidebar, FilterControls
    │   └── ui/               # shadcn-style primitives
    ├── context/
    │   ├── UserContext.tsx
    │   └── CompareContext.tsx
    ├── providers/
    │   └── I18nProvider.tsx  # Not mounted in root layout
    ├── hooks/
    │   └── useProfileActions.ts
    ├── lib/
    │   ├── apiClient.ts      # Defined but unused
    │   ├── auth.ts
    │   ├── config.ts         # API_URL resolution
    │   ├── constants.ts
    │   ├── i18n.ts
    │   ├── profile-utils.ts
    │   ├── registration-validation.ts
    │   └── utils.ts
    ├── types/
    │   └── index.ts
    └── locales/
        ├── en/translation.json
        └── ml/translation.json
```

## Where to add new code

| Change type | Location |
|-------------|----------|
| New API endpoint | `mn-api/src/interface/routes/*.route.ts` (or new route + mount in `index.ts`) |
| New use case | `mn-api/src/applications/use-cases/` |
| New DB model | `mn-api/prisma/schema.prisma` + migration |
| New dashboard page | `mn-client/src/app/dashboard/<name>/page.tsx` |
| New profile wizard step | `mn-client/src/components/profile-setup/` + step in `profile-builder/page.tsx` |
| Shared frontend types | `mn-client/src/types/index.ts` |

## Naming inconsistencies (documented, not fixed)

| Issue | Paths |
|-------|-------|
| `applications/` vs `application/` | Use cases vs SearchService |
| `prisamClient.ts` | Prisma client filename typo |
| Folder `mn-client` vs package name `mn-web` | `package.json` name differs from directory |

## Related documentation

- Frontend details: [03-frontend.md](./03-frontend.md)
- Backend details: [04-backend.md](./04-backend.md)
- Database schema: [05-database.md](./05-database.md)
