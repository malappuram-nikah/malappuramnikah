# Development Guide

Setup and workflow for local development of the Malappuram Nikah monorepo.

## Prerequisites

| Tool | Version (from codebase) |
|------|-------------------------|
| Node.js | 20 (Dockerfile) |
| PostgreSQL | 16 (docker-compose) |
| npm | For package management |

Optional:

- Docker + Docker Compose
- Cloudinary account (media uploads)
- WhatsApp API credentials (OTP in non-dev environments)

## Repository structure

```
malappuramnikah/
├── mn-api/      # Backend — port 3333
└── mn-client/   # Frontend — port 3000
```

See [02-file-structure.md](./02-file-structure.md) for full layout.

---

## Option A: Docker Compose

From repo root:

```bash
docker compose up --build
```

Services:

| Service | Port | Notes |
|---------|------|-------|
| postgres | 5432 | DB: `malappuramnikah`, user/pass from env or defaults |
| mn-api | 3333 | Only `DATABASE_URL`, `PORT`, `NODE_ENV` set |
| mn-client | 3000 | `NEXT_PUBLIC_API_URL` defaults to `http://localhost:3333` |

**After first start**, run migrations manually inside the API container or against the exposed Postgres port:

```bash
cd mn-api
npx prisma migrate deploy
```

**Limitations:** JWT secrets, WhatsApp, Cloudinary, and upload volumes are not configured in compose — see [16-known-issues.md](./16-known-issues.md).

---

## Option B: Local development (recommended for active work)

### 1. Start PostgreSQL

Use Docker for DB only:

```bash
docker compose up postgres -d
```

Or use a local PostgreSQL instance matching `DATABASE_URL`.

### 2. Backend setup

```bash
cd mn-api
cp .env.example .env
# Edit .env — set DATABASE_URL, ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET
npm install
npx prisma migrate deploy
npm run dev
```

API runs at `http://localhost:3333` with hot reload via `ts-node-dev`.

### 3. Frontend setup

```bash
cd mn-client
# Create .env.local if needed:
# NEXT_PUBLIC_API_URL=http://localhost:3333
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`.

---

## Environment variables

### Backend (`mn-api/.env.example`)

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `PORT` | No | Default 3333 |
| `NODE_ENV` | No | `development` / `production` — affects OTP leakage, cookie secure flag |
| `ACCESS_TOKEN_SECRET` | Yes (prod) | JWT access token signing |
| `REFRESH_TOKEN_SECRET` | Yes (prod) | JWT refresh token signing |
| `MSG91_AUTH_KEY` | No | SMS OTP — service exists but **not used** in registration |
| `MSG91_TEMPLATE_ID` | No | SMS template |
| `CLOUDINARY_*` | No | Media uploads; falls back to local filesystem |

**Also used in code (add to `.env` manually):**

| Variable | Purpose |
|----------|---------|
| `APP_URL` | Base URL for local upload URLs |
| `ULTRAMSG_INSTANCE_ID`, `ULTRAMSG_TOKEN` | WhatsApp OTP (primary) |
| `META_WA_ACCESS_TOKEN`, `META_WA_PHONE_NUMBER_ID`, `META_WA_TEMPLATE_NAME` | Meta WhatsApp fallback |
| `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID` | Aliases for Meta vars |

### Frontend

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | Backend base URL (default: `http://localhost:3333`) |

Also checks legacy names: `VITE_REACT_APP_API_URL`, `REACT_APP_API_URL`.

---

## Common commands

### Backend (`mn-api/`)

| Command | Action |
|---------|--------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Prisma generate + TypeScript compile → `dist/` |
| `npm start` | Run compiled `dist/index.js` |
| `npx prisma migrate dev` | Create/apply migration (dev) |
| `npx prisma migrate deploy` | Apply migrations (prod/CI) |
| `npx prisma studio` | DB GUI |

### Frontend (`mn-client/`)

| Command | Action |
|---------|--------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |

---

## Development workflows

### Adding an API endpoint

1. Add handler in `mn-api/src/interface/routes/<area>.route.ts`
2. Mount new router in `src/index.ts` if new file
3. Use `getUserIdFromRequest(req)` for JWT auth
4. Update [08-api.md](./08-api.md) when documenting

### Adding a dashboard page

1. Create `mn-client/src/app/dashboard/<name>/page.tsx`
2. Add sidebar link in dashboard sidebar component
3. Use `useUser()` for current user; attach Bearer token to fetch calls

### Database schema change

1. Edit `mn-api/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name <description>`
3. Update [05-database.md](./05-database.md)

### Testing OTP locally

With `NODE_ENV=development`, OTP may be returned in API responses. WhatsApp fallback logs OTP to console if external services are not configured.

---

## Debugging tips

| Symptom | Check |
|---------|-------|
| 401 on API calls | `localStorage.mn_token` present and not expired (15m) |
| CORS errors | Backend allows all origins — check API URL in frontend config |
| KYC document 404 | Path mismatch — see [10-file-storage.md](./10-file-storage.md) |
| Admin 403 | User must match adminGuard rules — see [07-rbac.md](./07-rbac.md) |
| Empty uploads after Docker restart | No volume mount for `public/uploads/` |

---

## Documentation maintenance

When changing implementation:

1. Update the **single-responsibility** doc file for that area
2. Add new issues to [16-known-issues.md](./16-known-issues.md)
3. Update [15-current-features.md](./15-current-features.md) if feature status changes
4. Keep [08-api.md](./08-api.md) as the canonical endpoint list

---

## Related documentation

- Project overview: [01-project-overview.md](./01-project-overview.md)
- Documentation index: [README.md](./README.md)
- Security before prod: [14-security.md](./14-security.md)
