"""Optional Apple Vision pose backend (macOS only) — NOT the default path.

Squat 360 defaults to MediaPipe for Android / Samsung. This module must never
be imported at package load time on Linux or Android. Use create_backend()
or import inside a platform check.
"""

from __future__ import annotations

import sys
from typing import List, Optional

import numpy as np

from ..core.pose_estimator import PoseEstimator, PoseResult


def _require_macos() -> None:
    if sys.platform != "darwin":
        raise ImportError(
            "AppleVisionBackend requires macOS (Apple Vision / CoreML). "
            "Squat 360 default path uses MediaPipe — "
            "from src.backends import MediaPipeBackend"
        )


class AppleVisionBackend(PoseEstimator):
    """Stub for an optional macOS Apple Vision backend.

    Not implemented in this fork's default path. Kept so docs and factory
    wiring stay explicit without breaking Linux/Android installs.
    """

    def __init__(self, **kwargs):
        _require_macos()
        # Lazy: real Vision/PyObjC imports would go here, still inside darwin-only path.
        raise NotImplementedError(
            "Apple Vision backend is optional and not wired for Squat 360. "
            "Use MediaPipeBackend for Android / Samsung / Linux."
        )

    def initialize(self) -> bool:
        return False

    def process_frame(self, frame: np.ndarray) -> Optional[PoseResult]:
        return None

    def release(self) -> None:
        pass

    def get_keypoint_names(self) -> List[str]:
        return []

    @property
    def backend_name(self) -> str:
        return "AppleVision"
