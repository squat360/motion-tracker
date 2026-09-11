# Samsung / Android Validation Checklist (Squat 360)

Squat 360 targets **Android / Samsung Galaxy** as the primary on-device path. This fork of [motion-tracker](https://github.com/squat360/motion-tracker) keeps **MediaPipe Pose** as the default pose backend so coaches can capture and review squat sessions on phones and foldables without macOS-only APIs.

> **Product note:** Squat 360 is built to **augment coaches**, not replace trainers. On-device pose and feedback are coaching aids for gym floors.

## Default stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Pose | **MediaPipe Pose** (Tasks / Pose Landmarker) | Default for Python demos and the Expo mobile scaffold |
| Mobile | Expo + React Native | `apps/squat360-mobile/` |
| Storage (local) | expo-sqlite | Clients, sessions, sets, feedback |
| Cloud (optional) | Firebase stubs | Auth / sync placeholders only |
| Apple Vision / CoreML / ARKit | **Not** on the default path | Optional macOS-only backend if added later |

Do **not** require Apple Vision, CoreML, or ARKit for Android builds, CI on Linux, or Samsung pilot installs.

## Galaxy / Fold7 validation checklist

Use this checklist before a gym pilot. Prefer a **Galaxy Fold7** (or current Fold) plus one standard Galaxy phone (e.g. S24/S25 class) when available.

### Device & OS

- [ ] Device: Galaxy Fold7 (unfolded + cover display) and one non-fold Galaxy
- [ ] Android version supported by current Expo SDK / target SDK
- [ ] Permissions: Camera, Microphone (if voice notes), Storage / media (as required by Expo)
- [ ] App installs via `npx expo start` → Expo Go **or** a local Android build
- [ ] Dark gym UI readable outdoors and under bright overhead LEDs

### Camera / Record tab

- [ ] Rear camera opens quickly; preview stable while holding phone on a tripod or stand
- [ ] Recording uses best available quality; prefer **2160p (4K)** when the device exposes it
- [ ] Fallback to 1080p is graceful when 2160p is unavailable
- [ ] Fold7 unfolded: framing a full squat (feet to head) from ~2–3 m in a typical rack bay
- [ ] Fold7 cover display: usable for quick “start/stop” if you use that mode in a pilot
- [ ] Orientation lock or consistent portrait/landscape policy documented for coaches

### Pose path (MediaPipe)

- [ ] Default backend documented as MediaPipe (Python package + mobile AI stubs)
- [ ] No import of Apple Vision / CoreML / ARKit on Android or Linux scripts
- [ ] Mock `SetCounter` / `TechniqueAnalyzer` run offline so UI can be demoed without native bindings
- [ ] TODO path noted for MediaPipe / TFLite on Android (GPU delegate when practical)
- [ ] Overlay placeholder in Review matches expected landmark frame (skeleton stub OK for scaffold)

### Review / coaching workflow

- [ ] Recorded clip plays in Review with overlay placeholder
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

### How Expo / RN will consume pose

Planned flow (scaffold today; native binding later):

1. **Record** — `expo-camera` captures video at highest practical resolution (prefer 2160p).
2. **Local index** — session metadata + file URI stored in sqlite (`sessions` / `sets`).
3. **Analyze** — `src/ai/` interfaces (`SetCounter`, `TechniqueAnalyzer`) receive frames or a video URI:
   - **Now:** mock implementations for UI and pilot walkthroughs.
   - **Next:** MediaPipe Pose / TFLite on Android (on-device); optional Python MediaPipe offline for desk review.
4. **Review** — player + overlay placeholder; replace stub landmarks with live/inferred keypoints when the native module lands.
5. **Plans / Clients** — rule-based plan stub + client list so coaches can assign follow-ups without leaving the app.

Python package alignment: `src/backends` defaults to `MediaPipeBackend`. Apple Vision remains optional and must stay import-gated so Linux/Android tooling never hard-depends on macOS frameworks.

### Pilot messaging

- Tooling supports **coach + athlete** review loops.
- Do not claim fixed accuracy percentages in marketing or pilot decks from this scaffold alone.
- Hardware extras (e.g. future IMX500) are optional—see `apps/squat360-mobile/src/hardware/`.

## Related

- Mobile app: [`apps/squat360-mobile/`](../apps/squat360-mobile/)
- Backends: [`src/backends/`](../src/backends/)
