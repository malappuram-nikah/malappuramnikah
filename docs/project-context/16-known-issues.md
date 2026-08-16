# Known Issues

Documented inconsistencies, incomplete wiring, and bugs confirmed from source code review. This is not an exhaustive bug tracker.

---

## Critical / security

| Issue | Location | Detail |
|-------|----------|--------|
| Admin login skips OTP validation | `admin.route.ts` — `POST /login` | Accepts `otpCode` in body but never checks it |
| Hardcoded admin user IDs | `admin.route.ts` — `adminGuard()` | User IDs 2 and 6 always admin |
| JWT secret fallbacks | `jwt.config.ts` | Uses hardcoded strings if env unset |
| CORS allows all origins | `index.ts` | Any origin permitted with credentials |

---

## Data / storage

| Issue | Location | Detail |
|-------|----------|--------|
| KYC local path mismatch | `MediaStorageService.ts` vs `user.route.ts` | Upload writes to `public/uploads/kyc/`; read/delete may use `kyc-uploads/` at project root |
| adminStore.json not in Docker volume | `docker-compose.yml` | Admin CMS/vendor data lost on container rebuild |
| Uploads not in Docker volume | `docker-compose.yml` | Local media ephemeral in containers |
| Notification model lacks User FK | `schema.prisma` | `user_id`/`sender_id` not relation-enforced |

---

## Authentication

| Issue | Location | Detail |
|-------|----------|--------|
| No refresh token endpoint | — | Refresh cookie set on login but never consumed |
| Access token expires in 15m | `jwt.config.ts` | No silent refresh on frontend |
| MSG91 service unused | `Msg91Service.ts` | Documented in `.env.example` but not wired to OTP flow |
| `JWT_SECRET` env unused | `.env.example` | Documented but not referenced in code |

---

## Backend architecture

| Issue | Location | Detail |
|-------|----------|--------|
| Redis configured but unused | `redis.config.ts` | `ioredis` dependency never imported elsewhere |
| Folder naming inconsistency | `applications/` vs `application/` | Use cases vs SearchService in different folders |
| Prisma client filename typo | `prisamClient.ts` | Misspelling of "prisma" |
| Mixed architecture | Various routes | Some use use cases; others inline Prisma in routes |
| Request body logging | `index.ts` middleware | Logs full body on most routes — may leak PII |

---

## Frontend

| Issue | Location | Detail |
|-------|----------|--------|
| `apiClient.ts` unused | `src/lib/apiClient.ts` | Wrapper defined but all calls use raw `fetch` |
| i18n not mounted | `I18nProvider.tsx` | Provider and LanguageSwitcher not in root layout |
| No Next.js middleware auth | — | Dashboard routes protected client-side only |
| Admin login OTP mocked | `admin/login/page.tsx` | Step 1 uses setTimeout, not API |
| Missing `/terms` and `/privacy` routes | Login page links | 404 if clicked |
| Stale client README | `mn-client/README.md` | References Vite template, not Next.js app |
| `AIMatchesLegacy.tsx` orphan | `components/dashboard/` | Not imported anywhere |
| Admin sidebar tabs | `dashboard/admin/page.tsx` | `complaints` and `plans` in nav — tab render **Needs verification** |

---

## Feature completeness

| Issue | Location | Detail |
|-------|----------|--------|
| AI matches placeholder | `/dashboard/matches` | "Coming soon" only |
| Premium payment not implemented | `/dashboard/premium` | UI-only plan cards |
| Save-the-date persistence | `/dashboard/save-the-date` | Backend persistence **Needs verification** |
| `POST /otp/verify-aadhaar` | Frontend settings | Backend endpoint **Needs verification** |
| Business user RBAC | `/dashboard/business` | Backend authorization model **Unknown** |

---

## Docker / deployment

| Issue | Location | Detail |
|-------|----------|--------|
| Migrations not run on startup | `mn-api/Dockerfile` | Must run `prisma migrate deploy` manually |
| Missing API env in compose | `docker-compose.yml` | JWT secrets, WhatsApp, Cloudinary, APP_URL not set |
| Single-instance online tracker | `onlineTracker.ts` | In-memory Set breaks with horizontal scaling |

---

## Documentation / repo hygiene

| Issue | Location | Detail |
|-------|----------|--------|
| Root README minimal | `README.md` | Single line; use `docs/project-context/` instead |
| Package name mismatch | `mn-client/package.json` | Directory `mn-client`, name `mn-web` |

---

## How to use this document

When fixing an issue:

1. Confirm it still exists in current code
2. Update the relevant focused doc (e.g. [14-security.md](./14-security.md) for security fixes)
3. Remove or amend the row here once resolved

## Related documentation

- Security analysis: [14-security.md](./14-security.md)
- Feature status: [15-current-features.md](./15-current-features.md)
- File storage bug detail: [10-file-storage.md](./10-file-storage.md)
