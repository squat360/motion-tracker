"""Core modules for pose estimation and motion analysis.

Imports are lazy so optional backends (and Android/Linux tooling) can load
lightweight symbols like PoseEstimator without requiring OpenCV immediately.
"""

from __future__ import annotations

__all__ = [
    "PoseEstimator",
    "PoseResult",
    "Keypoint",
    "AngleCalculator",
    "MotionAnalyzer",
    "VelocityAnalyzer",
    "VideoProcessor",
    "VideoSource",
    "FrameContext",
    "HighlightDetector",
    "SignalSource",
    "HighlightCandidate",
    "SportAnalyzer",
    "ActionTemplate",
    "CorrectionItem",
    "ActionDetection",
    "AnalysisLogger",
    "LogLevel",
    "EventType",
]

_EXPORTS = {
    "PoseEstimator": (".pose_estimator", "PoseEstimator"),
    "PoseResult": (".pose_estimator", "PoseResult"),
    "Keypoint": (".pose_estimator", "Keypoint"),
    "AngleCalculator": (".angle_calculator", "AngleCalculator"),
    "MotionAnalyzer": (".motion_analyzer", "MotionAnalyzer"),
    "VelocityAnalyzer": (".velocity_analyzer", "VelocityAnalyzer"),
    "VideoProcessor": (".video_processor", "VideoProcessor"),
    "VideoSource": (".video_processor", "VideoSource"),
    "FrameContext": (".video_processor", "FrameContext"),
    "HighlightDetector": (".highlight_detector", "HighlightDetector"),
    "SignalSource": (".highlight_detector", "SignalSource"),
    "HighlightCandidate": (".highlight_detector", "HighlightCandidate"),
    "SportAnalyzer": (".sport_analyzer", "SportAnalyzer"),
    "ActionTemplate": (".sport_analyzer", "ActionTemplate"),
    "CorrectionItem": (".sport_analyzer", "CorrectionItem"),
    "ActionDetection": (".sport_analyzer", "ActionDetection"),
    "AnalysisLogger": (".analysis_logger", "AnalysisLogger"),
    "LogLevel": (".analysis_logger", "LogLevel"),
    "EventType": (".analysis_logger", "EventType"),
}


def __getattr__(name: str):
    if name not in _EXPORTS:
        raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
    mod_name, attr = _EXPORTS[name]
    from importlib import import_module

    mod = import_module(mod_name, __name__)
    value = getattr(mod, attr)
    globals()[name] = value
    return value
