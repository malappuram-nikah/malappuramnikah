# File Storage

Media uploads (profile photos, video/voice intros, KYC documents, admin music) are handled by `MediaStorageService` with Cloudinary or local filesystem fallback.

**Primary file:** `mn-api/src/infrastructure/service/MediaStorageService.ts`

## Storage backends

### Cloudinary (optional)

Activated when all of these env vars are set:

| Variable | Alias also accepted |
|----------|---------------------|
| `CLOUDINARY_CLOUD_NAME` | `CLOUDINARY_NAME` |
| `CLOUDINARY_API_KEY` | — |
| `CLOUDINARY_API_SECRET` | `CLOUDINARY_SECRET_KEY` |

**Public uploads:** folder `malappuram_nikah/{folderName}`  
**Private KYC uploads:** folder `malappuram_nikah/kyc`, `type: "authenticated"`

If Cloudinary upload fails, service falls back to local storage.

### Local filesystem (fallback)

| Type | Directory | Public URL |
|------|-----------|------------|
| Public media | `public/uploads/{folderName}/` | `{APP_URL}/uploads/{folderName}/{filename}` |
| Private KYC | `public/uploads/kyc/` | Not directly public |

Static serving: `src/index.ts` mounts `express.static` at `/uploads` → `public/uploads/`.

**Env:** `APP_URL` — base URL for constructing local file URLs (used in `MediaStorageService.ts`, not in `.env.example`).

## Upload methods

### `uploadMedia(base64Data, folderName)`

For public profile content:

| folderName | Used for |
|------------|----------|
| `photos` | Profile photos |
| `videos` | Video introduction |
| `voices` | Voice introduction |
| `music` | Admin background music track |

Behavior:

- Skips re-upload if input is already `http://` or `https://` URL
- Parses data URI (`data:mime/type;base64,...`)
- Maps MIME types to file extensions (jpg, png, webp, mp4, webm, mov, mp3, wav, etc.)

### `uploadPrivateMedia(base64Data)`

For KYC identity documents. Same Cloudinary/local logic with KYC-specific folder and authenticated type on Cloudinary.

## KYC storage path inconsistency

**Confirmed issue:**

| Operation | Path used |
|-----------|-----------|
| `MediaStorageService.uploadPrivateMedia` | Writes to `public/uploads/kyc/` |
| `user.route.ts` KYC document read/delete | References `kyc-uploads/` at project root |

Local KYC document retrieval may fail if files were uploaded via `MediaStorageService` but read from `kyc-uploads/`. See [16-known-issues.md](./16-known-issues.md).

## KYC upload constraints (from `user.route.ts`)

| Constraint | Value |
|------------|-------|
| Max size | 5 MB per file |
| Formats | JPG, PNG, PDF |
| Document types | Aadhaar, Driving License, Passport, Voter ID, National ID, Other Government Issued ID |
| Input | Base64 in JSON body (`front_base64`, optional `back_base64`) |

Stored on User model: `kyc_front_url`, `kyc_back_url` (URLs or local paths).

## Profile media in database

Profile photos/video/voice are stored inside `User.profile_details` JSON as base64 data URLs or Cloudinary URLs within draft keys (e.g. `mn_profile_photos_draft.photos[].dataUrl`). The profile update flow may upload to Cloudinary/local when persisting — **Needs verification** for exact upload trigger (ReviewStep sends full drafts to API).

## Admin music uploads

Admin can upload background music via admin store update endpoints. Uses `uploadMedia` with folder `music`. Settings exposed publicly at `GET /user/admin/music/settings`.

## Docker considerations

`docker-compose.yml` does **not** mount volumes for:

- `public/uploads/`
- `kyc-uploads/`
- `adminStore.json`

Uploaded files and admin JSON changes are **ephemeral** inside containers unless volumes are added manually.

## Related documentation

- KYC workflow: [13-id-verification.md](./13-id-verification.md)
- Profile photos: [11-profile-system.md](./11-profile-system.md)
- Known path bug: [16-known-issues.md](./16-known-issues.md)
