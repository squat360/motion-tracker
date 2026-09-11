"""Pose estimation backend implementations.

Default backend for Squat 360 (Android / Samsung): MediaPipe.
Apple Vision is optional and import-gated for macOS only — see README.md.

Heavy deps (cv2 / mediapipe / Apple frameworks) load lazily so Linux and
Android-facing docs/scripts can import this package without macOS or OpenCV.
"""

from __future__ import annotations

from typing import Any

__all__ = [
    "MediaPipeBackend",
    "AppleVisionBackend",
    "create_backend",
    "DEFAULT_BACKEND",
]

DEFAULT_BACKEND = "mediapipe"


def __getattr__(name: str):
    if name == "MediaPipeBackend":
        from .mediapipe_backend import MediaPipeBackend

        return MediaPipeBackend
    if name == "AppleVisionBackend":
        # Gated: only resolve when explicitly requested.
        from .apple_vision_backend import AppleVisionBackend

        return AppleVisionBackend
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")


def create_backend(name: str = DEFAULT_BACKEND, **kwargs: Any):
    """Factory for pose backends.

    Args:
        name: Backend id. Default ``mediapipe``. Use ``apple_vision`` only on macOS.
        **kwargs: Passed to the backend constructor.

    Returns:
        A PoseEstimator instance.
    """
    key = (name or DEFAULT_BACKEND).lower().strip()
    if key in ("mediapipe", "mp", "default"):
        from .mediapipe_backend import MediaPipeBackend

        return MediaPipeBackend(**kwargs)
    if key in ("apple_vision", "vision", "apple"):
        from .apple_vision_backend import AppleVisionBackend

        return AppleVisionBackend(**kwargs)
    raise ValueError(
        f"Unknown backend '{name}'. Default is MediaPipe "
        f"(create_backend() or MediaPipeBackend)."
    )
