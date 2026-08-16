# Project Overview

## What this repository is

**Malappuram Nikah** is a matrimonial / matchmaking web platform aimed at the Malappuram community. The codebase is a monorepo with:

- **`mn-client`** — Next.js frontend for members, admins, and business users
- **`mn-api`** — Node.js/Express REST API with real-time messaging via Socket.io
- **`docker-compose.yml`** — optional containerized stack (PostgreSQL + both apps)

The root [README.md](../../README.md) contains only the project name; this documentation set replaces it for technical context.

## Core user flows (implemented)

| Flow | Status |
|------|--------|
| Register with mobile + password → WhatsApp OTP → account activation | Implemented |
| Login with mobile + password (JWT in response, refresh cookie) | Implemented |
| Multi-step profile builder with localStorage drafts | Implemented |
| Browse/search opposite-gender profiles | Implemented |
| Express interest → mutual match → chat | Implemented |
| Government ID (KYC) submission and admin review | Implemented |
| Male KYC gate before dashboard access | Implemented (frontend) |
| Referral codes, points, redeem | Implemented |
| Premium flag on user (`is_premium`) with search masking | Partially implemented |
| Admin command center (users, KYC, referrals, CMS, vendors) | Implemented |
| Save-the-date / wedding invitation UI | UI present; persistence **Needs verification** |
| Payment / subscription checkout | **Not implemented** (premium page is UI-only) |
| AI matches | **Not implemented** (`/dashboard/matches` is placeholder) |

## Technology stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Backend | Express 4, TypeScript, Prisma 6 |
| Database | PostgreSQL |
| Real-time | Socket.io (server + client) |
| Auth | JWT (access 15m, refresh 7d), bcrypt passwords |
| OTP delivery | WhatsApp (UltraMsg → Meta Cloud API → dev console fallback) |
| Media | Cloudinary (optional) or local filesystem |
| Containerization | Docker multi-stage builds + Compose |

## Architecture style

The backend uses a **partial clean architecture**:

- **Domain** — entity interfaces and repository contracts
- **Applications** — use cases for registration, login, OTP, profile update
- **Infrastructure** — Prisma repositories, external services, config
- **Interface** — Express routes and controllers

Many routes (chat, interest, admin, referral) call **Prisma directly** in route handlers rather than through use cases.

The frontend is **client-heavy**: most dashboard pages are `"use client"` components that fetch the API with raw `fetch()`. There is no Next.js middleware for auth.

## Deployment topology (from `docker-compose.yml`)

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│  mn-client  │────▶│   mn-api    │────▶│  PostgreSQL  │
│   :3000     │     │   :3333     │     │   :5432      │
└─────────────┘     └─────────────┘     └──────────────┘
                           │
                    Socket.io (same port)
```

## External integrations (confirmed in code)

| Integration | Purpose | Wired? |
|-------------|---------|--------|
| WhatsApp OTP (UltraMsg / Meta) | Registration & password-reset OTP | Yes |
| MSG91 SMS | OTP | Service exists; **not used** in registration flow |
| Cloudinary | Public & private media | Optional (env-dependent) |
| Redis (`ioredis`) | Caching | Config only; **not used** |

## User types

| Type | How identified |
|------|----------------|
| Member | Registered `User` with JWT |
| Admin | Hardcoded user IDs, `profile_details.isAdmin`, specific mobile numbers, or admin JWT from `/user/admin/login` |
| Business user | Frontend routes under `/business` and `/dashboard/business` — backend role model **Unknown** |

## Related documentation

- File layout: [02-file-structure.md](./02-file-structure.md)
- Feature inventory: [15-current-features.md](./15-current-features.md)
- Setup: [17-development-guide.md](./17-development-guide.md)
