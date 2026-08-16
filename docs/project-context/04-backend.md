# Backend

The backend lives in `mn-api/` and is an **Express 4** HTTP server with **Socket.io** on the same port.

## Entry point

**File:** `src/index.ts`

Responsibilities:

1. Create Express app + HTTP server
2. Initialize Socket.io with CORS `origin: "*"`
3. Apply CORS (allows all origins), JSON body parser (50MB limit)
4. Request logging middleware
5. Serve static uploads at `/uploads` → `public/uploads/`
6. Mount 8 route modules
7. Listen on `process.env.PORT || 3333`

### Socket.io events

| Event | Direction | Purpose |
|-------|-----------|---------|
| `join` | Client → Server | User joins room `user_{userId}`; adds ID to `onlineUsers` Set |
| `disconnect` | Client → Server | Removes user from `onlineUsers` |
| `private_message` | Server → Client | New chat message to recipient room |
| `notification` | Server → Client | Push notification to user room |
| `interest_match` | Server → Client | Mutual interest match notification |

Online user tracking: `src/infrastructure/onlineTracker.ts` — in-memory `Set<number>`, not Redis.

## Layer architecture

| Layer | Path | Contents |
|-------|------|----------|
| Domain | `src/domain/` | `User`, `Otp` interfaces; `IUserRepository`, `IOtpRepository` |
| Use cases | `src/applications/use-cases/user/` | Register, Login, SendOtp, VerifyOtp, UpdateProfile, GetAllUsers, GenerateGuestReferral |
| DTOs | `src/applications/dto/` | `LoginResponse.ts` |
| Services | `src/application/services/` | `SearchService.ts` (search orchestration) |
| Infrastructure | `src/infrastructure/` | Prisma client, repositories, JWT/Redis config, external services |
| Interface | `src/interface/` | Routes + controllers |

**Hybrid pattern:** User/OTP flows use controllers → use cases → repositories. Chat, interest, admin, referral, and notification routes often use **Prisma directly** in route handlers.

## Controllers

| Controller | File | Delegates to |
|------------|------|--------------|
| User | `interface/controllers/user.controller.ts` | Register, login, profiles, profile update use cases |
| OTP | `interface/controllers/otp.controller.ts` | SendOtp, VerifyOtp use cases |
| Search | `interface/controllers/search.controller.ts` | SearchService |

## Repositories

| Repository | File | Backing |
|------------|------|---------|
| UserRepository | `infrastructure/repositories/UserRepository.ts` | Prisma `User` |
| OtpRepository | `infrastructure/repositories/OtpRepository.ts` | Prisma `Verify` |
| SearchRepository | `infrastructure/database/SearchRepository.ts` | Prisma queries |

Prisma client singleton: `infrastructure/prisma/prisamClient.ts`.

## External services

| Service | File | Used by |
|---------|------|---------|
| AuthService | `infrastructure/service/AuthService.service.ts` | JWT generate/verify/decode |
| MediaStorageService | `infrastructure/service/MediaStorageService.ts` | Profile media + KYC uploads |
| WhatsappOtpService | `infrastructure/service/WhatsappOtpService.ts` | Registration & forgot-password OTP |
| Msg91Service | `infrastructure/service/Msg91Service.ts` | **Not wired** into OTP use cases |

## Auth helper (shared)

`getUserIdFromRequest(req)` in `interface/routes/interest.route.ts`:

- Reads `Authorization: Bearer <token>` or `?token=<token>`
- Verifies JWT with `accessTokenConfig.secret`
- Returns `payload.userId` or `null`

This function is imported by other route files for JWT extraction.

## Admin data store

`infrastructure/data/adminStore.json` — file-backed JSON for vendors, bookings, templates, CMS, subscriptions, activity logs, biodata settings, music settings. Read/written by `admin.route.ts` helper functions `getAdminStore()` / `saveAdminStore()`.

## Build and run

| Script | Command |
|--------|---------|
| `dev` | `ts-node-dev --respawn --transpile-only src/index.ts` |
| `build` | `npx prisma@6 generate && tsc` → output in `dist/` |
| `start` | `node dist/index.js` |

## Docker

`mn-api/Dockerfile` — multi-stage Node 20 Alpine build. Does **not** run Prisma migrations on startup.

## Related documentation

- API endpoints: [08-api.md](./08-api.md)
- Database: [05-database.md](./05-database.md)
- Auth: [06-authentication.md](./06-authentication.md)
- File storage: [10-file-storage.md](./10-file-storage.md)
