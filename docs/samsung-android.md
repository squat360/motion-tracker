# Samsung / Android Validation Checklist (Squat 360)

Squat 360 targets **Android / Samsung Galaxy** as the primary on-device path. This fork of [motion-tracker](https://github.com/squat360/motion-tracker) keeps **MediaPipe Pose** as the default pose backend so coaches can capture and review squat sessions on phones and foldables without macOS-only APIs.

> **Product note:** Squat 360 is built to **augment coaches**, not replace trainers. On-device pose and feedback are coaching aids for gym floors. Do **not** claim fixed accuracy percentages from this app.

## Default stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Pose | **MediaPipe Pose Landmarker** via `@thinksys/react-native-mediapipe` | 33 landmarks, Android-first. Requires a **dev client**, not Expo Go |
| Analyze | `LandmarkSetCounter` + `LandmarkTechniqueAnalyzer` | Pure TypeScript; unit-tested with fixtures |
| Fallback | Mock + fixture overlay | Web / Expo Go / iOS without the native module |
| Mobile | Expo SDK 57 + `expo-dev-client` | `apps/squat360-mobile/` — `npx expo run:android` |
| Storage (local) | expo-sqlite | Clients, sessions, sets, feedback |
| Cloud (optional) | Firebase stubs | Auth / sync placeholders only |
| Apple Vision / CoreML / ARKit | **Not** on the default path | Optional macOS-only Python backend if added later |

Do **not** require Apple Vision, CoreML, or ARKit for Android builds, CI on Linux, or Samsung pilot installs.

## Package investigation (2026)

| Option | Verdict for this Expo app |
|--------|---------------------------|
| **`@thinksys/react-native-mediapipe`** | **Chosen.** Pose camera + `onLandmark` (33 pts) on Android. Works with Expo **prebuild / dev client**. No official Expo Go support. |
| `react-native-vision-camera` v5 + frame processors | Strong camera, but MediaPipe plugins still cluster on VisionCamera **v4** / `worklets-core`. Extra Nitro deps on SDK 57. Revisit if a maintained Pose plugin ships. |
| `expo-vision-camera-v4-mediapipe` | Android-only; pose is opt-in (`enablePose`). Tied to VisionCamera v4. |
| TFLite MoveNet / PoseNet RN packages | Possible GPU delegate path; more custom glue, weaker Expo plugin story. |
| Python MediaPipe Tasks | Default **desk** backend (`src/backends`). Not on-device in the Expo app. |

Live pose **cannot** load in Expo Go. The adapter (`src/ai/nativePose.ts`) checks `UIManager` / `NativeModules` and falls back without crashing.

## Galaxy / Fold7 — run it

These commands assume a **laptop/desktop with Android SDK** (Android Studio or command-line tools). The Linux workspace used to author this PR does **not** include an Android SDK, so `expo run:android` must be executed on Adam’s machine with the Fold7 attached.

### USB debugging

1. Unfold the Fold7 for full-body framing (cover display is OK for start/stop only).
2. **Settings → About phone → Software information** → tap **Build number** 7×.
3. **Settings → Developer options → USB debugging** ON.
4. USB-C to the computer. Unlock → **Allow USB debugging**.
5. `adb devices` shows the Fold7 as `device`.

### Build & install

```bash
cd apps/squat360-mobile
npm install
npx expo prebuild --platform android
npx expo run:android
```

First launch: grant **Camera** (and **Mic** if you want audio on the expo-camera fallback path).

After the native binary is installed:

```bash
npx expo start --dev-client
```

Open **Squat 360** on the phone — not Expo Go.

Exact notes and failure hints: [`apps/squat360-mobile/README.md`](../apps/squat360-mobile/README.md).

## Galaxy / Fold7 validation checklist

Use this checklist before a gym pilot. Prefer a **Galaxy Fold7** (or current Fold) plus one standard Galaxy phone (e.g. S24/S25 class) when available.

### Device & OS

- [ ] Device: Galaxy Fold7 (unfolded + cover display) and one non-fold Galaxy
- [ ] Android version supported by current Expo SDK / target SDK
- [ ] Permissions: Camera, Microphone (if voice notes)
- [ ] App installs via **`npx expo run:android`** (dev client). Expo Go is UI-only fallback
- [ ] Dark gym UI readable outdoors and under bright overhead LEDs

### Camera / Record tab

- [ ] Rear camera opens quickly; preview stable on a tripod or stand
- [ ] **Dev client:** Settings shows native module **linked**; Record HUD updates from live landmarks
- [ ] Recording / capture indexes a session in sqlite; Review shows keypoint overlay
- [ ] Fallback quality: `expo-camera` still prefers **2160p** when native pose is not linked
- [ ] Fold7 unfolded: framing a full squat (feet to head) from ~2–3 m in a typical rack bay
- [ ] Fold7 cover display: usable for quick start/stop if you use that mode in a pilot

### Pose path (MediaPipe)

- [ ] Default backend documented as MediaPipe (Python package + mobile native adapter)
- [ ] No import of Apple Vision / CoreML / ARKit on Android or Linux scripts
- [ ] `npm test` in `apps/squat360-mobile` passes (fixture squat → 3 reps; shallow squat → depth cue)
- [ ] Native missing → mock/fixture fallback, no red screen
- [ ] Overlay draws keypoints/skeleton when a `PoseFrame` is present (live or fixture)

### Review / coaching workflow

- [ ] Recorded clip (if any) plays in Review with overlay
- [ ] Session / set / feedback rows persist in expo-sqlite after restart
- [ ] Seed clients appear so a coach can demo without empty state
- [ ] Messaging stays coach-assistive (cues, flags, plan stubs)—not “replaces your trainer”

### Gym lighting notes

Gym floors are hard for pose:

- **Mixed lighting:** overhead LEDs + window glare → prefer camera facing away from bright windows; avoid backlighting the lifter.
- **Shadows under racks:** ask athletes to step slightly forward of deep cage shadows when possible.
- **Clothing:** high-contrast top/shorts help landmarks; all-black kits under dim lights reduce contrast.
- **Distance:** full body in frame with margin for depth; Fold unfolded helps vertical FOV for tall athletes.
- **Mirrors:** avoid filming primarily via mirror reflection (duplicate silhouettes confuse detectors).
- **Busy backgrounds:** other racks/people in frame can distract; a simple cone or tape mark for camera placement helps consistency.
- **Flicker:** some LED banks flicker on rolling shutter; if stripes appear, slightly change shutter/FPS or angle.

### How Expo / RN consumes pose

1. **Record**
   - **Dev client (Fold7):** `NativePoseCamera` (`@thinksys/react-native-mediapipe`) streams `onLandmark` → `normalizeNativeLandmarkPayload` → `LandmarkSetCounter`.
   - **Expo Go / web:** `expo-camera` (when available) + optional fixture overlay. Same analyzer interfaces, labeled as fallback.
2. **Local index** — session metadata + optional file URI stored in sqlite (`sessions` / `sets`).
3. **Analyze** — `src/ai/` `SetCounter` + `TechniqueAnalyzer`:
   - Live or fixture frames go through the landmark engines.
   - Mock implementations remain for empty/no-module paths.
4. **Review** — player + keypoint/skeleton overlay from the last captured frames (or the sample squat fixture).
5. **Plans / Clients** — rule-based plan stub from those findings + client list.

Python package alignment: `src/backends` defaults to `MediaPipeBackend`. Apple Vision remains optional and must stay import-gated so Linux/Android tooling never hard-depends on macOS frameworks.

### Pilot messaging

- Tooling supports **coach + athlete** review loops.
- Do not claim fixed accuracy percentages in marketing or pilot decks.
- Hardware extras (e.g. future IMX500) are optional—see `apps/squat360-mobile/src/hardware/`.

## Related

- Mobile app: [`apps/squat360-mobile/`](../apps/squat360-mobile/)
- Backends: [`src/backends/`](../src/backends/)
