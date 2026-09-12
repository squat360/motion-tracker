# Pose backends

**Default (Squat 360 / Android / Samsung):** [MediaPipe Pose](mediapipe_backend.py) via `MediaPipeBackend`.

```python
from src.backends import MediaPipeBackend, create_backend

estimator = MediaPipeBackend()          # preferred
# or
estimator = create_backend("mediapipe") # same default
```

## Apple Vision (optional, macOS only)

`AppleVisionBackend` is **not** on the default path. Imports are gated so Linux CI and Android-facing scripts do not require macOS frameworks (Vision / CoreML / ARKit).

```python
from src.backends import create_backend

# Only resolves on macOS when a real implementation is present;
# otherwise raises a clear ImportError / NotImplementedError.
estimator = create_backend("apple_vision")
```

YOLO and other backends remain optional plugins. See [docs/samsung-android.md](../../docs/samsung-android.md).
