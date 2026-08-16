# Project Context Documentation

This directory documents the **current implementation** of the Malappuram Nikah monorepo as it exists in code today. It is not a product vision document—when behavior cannot be confirmed from source, entries are marked **Unknown** or **Needs verification**.

## Repository layout

| Package | Path | Role |
|---------|------|------|
| Frontend | `mn-client/` | Next.js 16 App Router web app (package name: `mn-web`) |
| Backend | `mn-api/` | Express + Prisma + Socket.io API |
| Infrastructure | `docker-compose.yml` | PostgreSQL, API, and client containers |

Default local ports: frontend **3000**, API **3333**, PostgreSQL **5432**.

---

## Documentation index by development task

Use this table to find the right file before changing code.

| If you are working on… | Read |
|------------------------|------|
| Understanding what the product does today | [01-project-overview.md](./01-project-overview.md) |
| Finding where files live or adding new modules | [02-file-structure.md](./02-file-structure.md) |
| Next.js pages, components, dashboard UI, client state | [03-frontend.md](./03-frontend.md) |
| Express routes, use cases, services, Socket.io | [04-backend.md](./04-backend.md) |
| Prisma models, migrations, JSON columns | [05-database.md](./05-database.md) |
| Login, registration, OTP, JWT, password reset | [06-authentication.md](./06-authentication.md) |
| Admin access, gender rules, premium gating, permissions | [07-rbac.md](./07-rbac.md) |
| REST endpoints, request/response patterns | [08-api.md](./08-api.md) |
| Redis, localStorage, React context, online tracking | [09-caching-state.md](./09-caching-state.md) |
| Profile photos, KYC uploads, Cloudinary vs local | [10-file-storage.md](./10-file-storage.md) |
| Profile builder, drafts, biodata, completion tracking | [11-profile-system.md](./11-profile-system.md) |
| Admin dashboard, adminStore.json, CMS, vendors | [12-admin.md](./12-admin.md) |
| KYC submit/review workflow, verification wall | [13-id-verification.md](./13-id-verification.md) |
| CORS, secrets, known security gaps | [14-security.md](./14-security.md) |
| Feature inventory (what ships vs placeholder) | [15-current-features.md](./15-current-features.md) |
| Bugs, inconsistencies, incomplete wiring | [16-known-issues.md](./16-known-issues.md) |
| Local setup, env vars, Docker, scripts | [17-development-guide.md](./17-development-guide.md) |

---

## Recommended reading order

### New contributor (first day)

1. [01-project-overview.md](./01-project-overview.md)
2. [02-file-structure.md](./02-file-structure.md)
3. [17-development-guide.md](./17-development-guide.md)

### Frontend feature work

1. [03-frontend.md](./03-frontend.md)
2. [06-authentication.md](./06-authentication.md)
3. [08-api.md](./08-api.md)
4. [09-caching-state.md](./09-caching-state.md)

### Backend / API work

1. [04-backend.md](./04-backend.md)
2. [05-database.md](./05-database.md)
3. [08-api.md](./08-api.md)

### Profile or KYC changes

1. [11-profile-system.md](./11-profile-system.md)
2. [13-id-verification.md](./13-id-verification.md)
3. [10-file-storage.md](./10-file-storage.md)

### Admin or referral tooling

1. [12-admin.md](./12-admin.md)
2. [07-rbac.md](./07-rbac.md)

### Before production hardening

1. [14-security.md](./14-security.md)
2. [16-known-issues.md](./16-known-issues.md)

---

## Maintenance rules

- Update the relevant single-responsibility file when implementation changes.
- Do not duplicate full endpoint lists across files—[08-api.md](./08-api.md) is the canonical API reference.
- Prefer citing file paths (e.g. `mn-api/src/index.ts`) over describing behavior from memory.
- Mark unverified behavior explicitly rather than guessing.
