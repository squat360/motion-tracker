# Squat 360 Mobile (Expo)

Samsung / Android–first coach companion scaffold for the [motion-tracker](https://github.com/squat360/motion-tracker) Squat 360 fork.

**Augments coaches — does not replace trainers.** Default pose path: **MediaPipe Pose** (native MediaPipe/TFLite binding TODO on Android).

## Quick start

```bash
cd apps/squat360-mobile
npm install
npx expo start
```

Then open on a Galaxy device with Expo Go, or use a development build for full camera quality controls.

## Tabs

| Tab | Purpose |
|-----|---------|
| Home | Dark gym overview + CTA |
| Record | `expo-camera` video; prefer **2160p** when available |
| Review | Player + pose overlay placeholder + mock AI |
| Plans | Rule-based plan stub from technique cues |
| Clients | `expo-sqlite` clients (seeded) |
| Settings | Backend / Firebase / hardware notes |

## Samsung test notes (Fold7)

- Prefer **Galaxy Fold7** unfolded for full-body framing; also smoke-test the cover display.
- Gym lighting: avoid backlighting; watch LED flicker and mirrors — see [`docs/samsung-android.md`](../../docs/samsung-android.md).
- Grant camera (and mic if recording audio).
- Confirm Record → sqlite session → Review placeholder overlay.
- Do not treat mock set counts / cues as validated accuracy metrics.

## Stack notes

- Expo SDK current stable (scaffold uses Expo 57 / RN from `create-expo-app`).
- TypeScript `strict` enabled via `tsconfig.json`.
- Firebase: copy `.env.example` → `.env` when needed; stubs never replace local sqlite for pilots.
- Optional hardware: `src/hardware/` (IMX500 future).

## Scripts

```bash
npm start          # npx expo start
npm run android    # expo start --android
npm run web        # web smoke
npm run typecheck  # tsc --noEmit
```
