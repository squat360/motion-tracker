# Squat 360 Mobile (Expo)

Samsung / Android–first coach companion for the [motion-tracker](https://github.com/squat360/motion-tracker) Squat 360 fork.

**Augments coaches — does not replace trainers.** Default pose path: **on-device MediaPipe Pose** via `@thinksys/react-native-mediapipe` in an **Expo dev client** (`npx expo run:android`). Expo Go cannot load that native module; Record/Review then use a mock + fixture overlay.

Do **not** treat set counts or cues as gym-validated accuracy scores.


## Fold7-safe preview (v1.0.2)

Native `@thinksys/react-native-mediapipe` is **not** shipped in the default EAS `preview` APK (it crashed at splash on Android 16 Fold7). Record uses Expo Camera + fixtures; FitWave / AI Assistant still work offline.

- Set `EXPO_NO_MEDIAPIPE=0` and re-add the ThinkSys package when you want a `pose` APK with live landmarks.
- AI Assistant tab queues motivational avatars to [squat360/ComfyUI](https://github.com/squat360/ComfyUI) when `EXPO_PUBLIC_COMFYUI_URL` is set (default ComfyUI port `8188`).

## ComfyUI AI Assistant

Custom workouts, food plans, form advice, and avatar prompts live under `src/ai/comfyui/`. Run ComfyUI from the squat360 fork, then:

```bash
export EXPO_PUBLIC_COMFYUI_URL=http://<gpu-host>:8188
```


## Super Coach (v1.3.0)

The AI tab is now Super Coach — same rule engine as `squat360/ComfyUI` `Squat360SuperCoach`.

- Phase (`accumulate` / `intensify` / `rebuild` / `deload`), load bias, and calorie bias run **on-device** from sqlite set history + live camera cues.
- Optional `EXPO_PUBLIC_LLM_URL` (OpenAI-compatible `/v1/chat/completions`) may rewrite briefing/answer copy. **Empty URL = local only.** Cloud copy never changes phase, load, or calories.
- Ask about depth, knees, food, fatigue, or load.

```bash
cd apps/squat360-mobile
npm test   # landmark pipeline + Super Coach (matches ComfyUI node tests)
```

## FitWave form heuristics

Useful pieces from [squat360/FitWave](https://github.com/squat360/FitWave) (fork of VedankPande/FitWave) are ported in `src/ai/fitwaveFormChecks.ts` — biceps / plank / press angle cues adapted to MediaPipe landmarks. They show up in Review technique findings alongside squat depth heuristics.

## Fold7 crash note (v1.0.1)

Preview APK `1.0.0` flashed splash then exited on Android 16. Fix: removed unused `react-native-reanimated` side-effect import and added `babel.config.js` (`babel-preset-expo`). Reinstall the new APK (versionCode 2).


## Why a dev client (not Expo Go)

| Path | What you get |
|------|----------------|
| `npx expo run:android` on Fold7 | Native MediaPipe Pose Landmarker, live keypoints, landmark → `LandmarkSetCounter` / `LandmarkTechniqueAnalyzer` |
| Expo Go / web | Camera (Go) or no native pose; fixture skeleton + mock/fallback so the UI stays usable |

Vision Camera + frame processors and TFLite GPU delegates were considered. In 2026 the most straightforward Expo-prebuild pose view that actually exposes 33-point `onLandmark` on Android is **ThinkSys MediaPipe**. VisionCamera v5 MediaPipe plugins still lag (many target VisionCamera v4 / worklets-core). We can swap the adapter later without changing the counter/analyzer.

## Fold7 — exact commands

These must run on a **machine with Android SDK / platform-tools** (this repo’s Linux CI box does **not** ship an Android SDK). The Galaxy Fold7 is the device under test.

### 1. USB debugging

1. Unfold the Fold7 (full-body framing) or use the cover display for start/stop only.
2. **Settings → About phone → Software information →** tap **Build number** seven times.
3. **Settings → Developer options → USB debugging** ON. Optional: **Stay awake**, **Wireless debugging** if you prefer `adb pair`.
4. USB-C cable to the computer. Unlock the phone and tap **Allow** on the RSA prompt.
5. Confirm:

```bash
adb devices
# expect: <serial>    device
```

If empty: try another cable/port, set USB mode to **File transfer (MTP)**, or `adb kill-server && adb start-server`.

### 2. Install & native run

```bash
cd apps/squat360-mobile
npm install

# Generates android/ (gitignored). Needs Android SDK.
npx expo prebuild --platform android

# Builds the debug APK, installs on the attached Fold7, starts Metro.
npx expo run:android
# same as: npm run android
```

Grant **Camera** (and **Microphone** if prompted) on first launch.

Wireless after the first USB pairing:

```bash
adb tcpip 5555
adb connect <fold7-ip>:5555
npx expo run:android
```

### 3. Day-to-day after the native binary is installed

```bash
cd apps/squat360-mobile
npx expo start --dev-client
# or: npm run start:dev
```

Open the **Squat 360** dev client on the Fold7 (not Expo Go).

### 4. Permissions & gym framing

- Camera: required for Record + MediaPipe.
- Mic: only if you want audio on `expo-camera` clips (fallback path).
- Unfolded, ~2–3 m back, full body in frame, camera away from windows/mirrors. See [`docs/samsung-android.md`](../../docs/samsung-android.md).

### 5. If `expo run:android` fails

- `adb devices` must show the Fold7.
- `echo $ANDROID_HOME` (or Android Studio SDK path) must be set; install SDK Platform 35 + build-tools.
- JDK 17 is what Expo 57 expects.
- First Gradle download is large; retry if the network drops.
- Expo Go will **not** fix a missing native module — do not fall back to Go for live pose.

## Tabs

| Tab | Purpose |
|-----|---------|
| Home | Dark gym overview + CTA |
| Record | Native MediaPipe camera when linked; else `expo-camera` (prefer **2160p**) + optional fixture overlay |
| Review | Player + keypoint/skeleton overlay from last capture or fixture |
| Plans | Rule-based stub from landmark technique cues |
| Clients | `expo-sqlite` clients (seeded) |
| Settings | Backend / native-link status / Firebase / hardware notes |

## Pose pipeline (works without a device)

```
native onLandmark | fixture JSON
        ↓
normalizeNativeLandmarkPayload  →  PoseFrame (33 named landmarks)
        ↓
LandmarkSetCounter (knee-angle FSM)     LandmarkTechniqueAnalyzer (depth / knees / lean)
        ↓
Record HUD + Review overlay + Plans stub
```

Unit tests (no Android SDK, no Apple frameworks):

```bash
cd apps/squat360-mobile
npm test
npm run typecheck
```

## Scripts

```bash
npm start              # Metro (Expo Go / web smoke)
npm run start:dev      # Metro for the installed dev client
npm run android        # expo run:android (needs SDK + device)
npm run prebuild:android
npm run web
npm test               # landmark → rep pipeline
npm run typecheck
```

## Stack notes

- Expo SDK 57 + `expo-dev-client` + `expo-build-properties` (Android minSdk **26**).
- TypeScript `strict` via `tsconfig.json`. No Apple Vision / CoreML / ARKit imports.
- Firebase: copy `.env.example` → `.env` when needed; stubs never replace local sqlite.
- Optional hardware: `src/hardware/` (IMX500 future).

## Install on Fold7 without a local Android SDK (EAS)

Use **Expo Application Services** to build an APK in the cloud, then download it on the phone.

### One-time (on any computer with Node, or ask the Squat 360 bot)

```bash
cd apps/squat360-mobile
npm install
npx eas-cli login          # Expo account
npx eas-cli init           # links this app (creates projectId in app.json)
npx eas build --platform android --profile preview
```

When the build finishes, EAS shows a **QR code / download URL**.

### On the Fold7

1. Open the EAS download link in **Chrome** (not in-app browsers that block APKs).
2. If Android blocks install: **Settings → Security** (or **Apps → Special access**) → allow **Install unknown apps** for Chrome.
3. Install the APK → open **Squat 360** → grant Camera.
4. Settings should show the MediaPipe native module **linked**.

Use profile **`preview`** for a standalone APK (best for quick Fold7 tests).  
Use **`development`** if you still want a dev client that talks to Metro.

