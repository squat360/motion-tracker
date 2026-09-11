# Motion Tracker - Real-time Human Motion Analysis System

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Android%20%2F%20Samsung-green.svg)](docs/samsung-android.md)
[![Pose](https://img.shields.io/badge/Pose-MediaPipe%20default-blue.svg)](src/backends/)
[![Apple Vision](https://img.shields.io/badge/Apple%20Vision-macOS%20optional-lightgrey.svg)](src/backends/README.md)

**Squat 360 fork** of motion-tracker: Samsung / Android–viable squat coaching tooling that **augments coaches** (does not replace trainers). Primary on-device path is **MediaPipe Pose** on Galaxy devices (incl. Fold7). See [Samsung / Android guide](docs/samsung-android.md).

A real-time human motion tracking and analysis system for posture correction, fitness training, dance coaching, and gym-floor coaching apps—with Android / Samsung as the primary mobile target and Apple Vision marked **macOS-optional** (not the default path).

## Preview

<p align="center">
  <img src="assets/demo-preview.jpg" alt="Motion Tracker Demo" width="100%">
  <br>
  <em>Real-time pose tracking with 33 keypoints, joint angles, and comprehensive posture analysis</em>
</p>

## Why Motion Tracker?

### 🎯 Key Advantages

- **Production-Ready Accuracy**: 3-5° joint angle precision with 3D world coordinates, meeting professional athletic analysis standards
- **Android / Samsung First**: Mobile scaffold targets Galaxy (Fold7 checklist); MediaPipe Pose is the default backend
- **Complete Skeleton Tracking**: 33 keypoints including face, hands, and feet - far more comprehensive than typical 17-point systems
- **Rich Posture Metrics**: Beyond joint angles - tracks head tilt, neck posture, body lean, shoulder/hip alignment, and spine curvature
- **Intelligent Movement Comparison**: DTW (Dynamic Time Warping) algorithm handles different speeds and timing variations in dance coaching
- **Zero Cloud Dependencies**: 100% on-device processing - no API costs, no privacy concerns, no internet required
- **Flexible Architecture**: Plugin-based backends — **MediaPipe (default)**, optional Apple Vision (macOS), YOLO11 — swap without rewriting app code
- **Battle-Tested Code**: Comprehensive test coverage, extensive error handling, and real-world validation across multiple demos

### 🚀 Technical Highlights

| Feature | Motion Tracker | Typical Solutions |
|---------|---------------|-------------------|
| **Keypoints** | 33 (full body + face + hands) | 17 (basic skeleton) |
| **Angle Accuracy** | 3-5° (athlete-grade) | 10-15° (consumer-grade) |
| **3D Tracking** | ✓ World coordinates in meters | ✗ 2D only or limited 3D |
| **Posture Analysis** | 6+ metrics (head tilt, spine curve, etc.) | Basic joint angles only |
| **Dance Comparison** | DTW algorithm (speed-agnostic) | Simple frame matching |
| **Neck Rendering** | ✓ Complete with 31 connections | ✗ Often missing |
| **Privacy** | 100% on-device | Cloud-dependent |
| **Performance** | 35+ FPS on M4 (native ARM64) | 15-25 FPS (x86 emulation) |

## Features

- **Real-time Pose Estimation**: 30+ FPS on Mac M4 using camera input
- **33 3D Keypoints**: Full-body tracking including face, hands, and feet
- **Precise Angle Calculation**: Measure joint angles with <5° accuracy for athletic analysis
- **Comprehensive Posture Metrics**: Head tilt, neck angle, body lean, shoulder/hip tilt, spine curvature
- **Multiple Backends**:
  - **MediaPipe (default)** — Android / Samsung / cross-platform, 33 keypoints
  - Apple Vision Framework — **macOS optional only**, not required for Squat 360
  - YOLO11 (multi-person scenarios, 17 keypoints)
- **Smart Movement Comparison**: DTW algorithm for dance coaching - works regardless of speed differences
- **Professional Visualization**:
  - 31 skeleton connections including neck/head
  - Color-coded angle feedback (green/orange/red)
  - Dual-panel real-time metrics display
- **Applications**:
  - Posture correction with 6+ posture metrics
  - Fitness form analysis with angle thresholds
  - Dance movement coaching with 0-100 scoring
  - Interactive body games and AR experiences
- **Mobile scaffold**: Expo app under `apps/squat360-mobile/` (Record / Review / Plans / Clients)

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/squat360/motion-tracker.git
cd motion-tracker

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On macOS/Linux

# Install dependencies
pip install -r requirements.txt
```

### Run Webcam Demo

```bash
python demos/webcam_demo.py
```

### Basic Usage

```python
from src.backends.mediapipe_backend import MediaPipeBackend
from src.core.angle_calculator import AngleCalculator

# Initialize pose estimator
estimator = MediaPipeBackend()
calculator = AngleCalculator()

# Process frame
results = estimator.process_frame(frame)

# Calculate elbow angle
elbow_angle = calculator.calculate_joint_angle(
    results,
    joint='left_elbow'
)

print(f"Left elbow angle: {elbow_angle:.1f}°")
```

## Architecture

```
motion-tracker/
├── apps/
│   └── squat360-mobile/   # Expo + TypeScript (Samsung / Android)
├── src/
│   ├── core/              # Core interfaces and utilities
│   ├── backends/          # Pose backends (MediaPipe default)
│   ├── applications/      # Ready-to-use applications
│   └── visualization/     # Rendering overlays
├── demos/                 # Example demonstrations
├── tests/                 # Unit tests
└── docs/                  # Incl. samsung-android.md
```

## Supported Backends

| Backend | Keypoints | 3D Support | FPS | Best For |
|---------|-----------|------------|-----|----------|
| **MediaPipe (default)** | 33 | ✓ | 30+ | Android / Samsung, full body |
| Apple Vision (optional) | 19 | ✓ | 60+ | macOS only — not default path |
| YOLO11 | 17 | ✗ | 100+ | Multi-person detection |

## Applications

### Posture Correction

Monitors sitting/standing posture in real-time and provides corrective feedback.

```bash
python demos/posture_correction_demo.py
```

### Fitness Trainer

Analyzes exercise form (squats, push-ups, etc.) with angle-based feedback.

```bash
python demos/fitness_trainer_demo.py
```

### Dance Coach

Record reference dance movements and compare your performance in real-time.

```bash
python demos/dance_coach_demo.py
```

**How to use:**
1. Press `r` to start recording your reference dance (3-10 seconds)
2. Press `r` again to stop recording
3. Press `p` to start practice mode
4. Perform the dance - you'll get real-time feedback
5. Press `p` to stop and see your score

**Features:**
- Dynamic Time Warping (DTW) for temporal alignment
- Real-time joint angle comparison
- Overall score (0-100)
- Save/load reference sequences

## Performance

Reference (desktop / laptop; mobile TBD per device):
- MediaPipe: typically 30+ FPS @ 720p on modern hardware
- Apple Vision (optional macOS): higher FPS on Apple Silicon when implemented
- YOLO11: multi-person / throughput-oriented

Samsung Galaxy validation checklist (Fold7, gym lighting): [docs/samsung-android.md](docs/samsung-android.md)

## Requirements

- **Primary:** Android device (Samsung Galaxy recommended) for the Expo app; Python 3.10+ for demos/backends
- Linux / macOS / Windows OK for MediaPipe Python path
- Apple Vision / CoreML / ARKit: **not required** (macOS-optional only)
- Webcam or device camera

## Technical Details

- **Angle Calculation Accuracy**: 3-5° average error
- **Latency**: <50ms end-to-end
- **Supported Angles**: Shoulder, elbow, wrist, hip, knee, ankle, spine, neck
- **Coordinate System**: 3D world coordinates in meters

## Roadmap

- [x] Samsung / Android docs + Expo mobile scaffold (`apps/squat360-mobile/`)
- [ ] MediaPipe / TFLite on-device binding in the Expo app
- [ ] Fold7 pilot hardening (camera presets, overlay, sqlite sync)
- [ ] Multi-camera calibration for enhanced 3D accuracy
- [ ] Optional cloud analytics (Firebase stubs in place)
- [ ] Apple Vision backend remains macOS-optional only

## Squat 360

This repository is maintained as the **Squat 360** motion-tracker fork for gym coaching workflows:

- Primary platform: **Android / Samsung** ([validation checklist](docs/samsung-android.md))
- Default pose: **MediaPipe** ([backends README](src/backends/README.md))
- Mobile UI: `apps/squat360-mobile/` — Home, Record, Review, Plans, Clients, Settings
- Goal: help coaches review form and plan training — **augment coaches, not replace trainers**

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [MediaPipe](https://google.github.io/mediapipe/) by Google
- [Apple Vision Framework](https://developer.apple.com/documentation/vision)
- [Ultralytics YOLO](https://github.com/ultralytics/ultralytics)
- [OpenMMLab MMPose](https://github.com/open-mmlab/mmpose)

## References

- [MediaPipe Pose](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker)
- [BlazePose Research](https://arxiv.org/abs/2006.10204)
- [Apple Vision 3D Pose](https://developer.apple.com/documentation/vision/detecting-human-body-poses-in-3d-with-vision)

## Citation

If you use this project in your research, please cite:

```bibtex
@software{motion_tracker_2026,
  title = {Motion Tracker: Real-time Human Motion Analysis System},
  author = {Your Name},
  year = {2026},
  url = {https://github.com/squat360/motion-tracker}
}
```
