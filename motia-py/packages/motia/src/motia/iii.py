"""III SDK client initialization for Motia framework."""

import os
from typing import Any

from iii import III

_engine_ws_url = os.environ.get("III_BRIDGE_URL", "ws://localhost:49134")
_instance: III | None = None


def get_instance() -> III:
    """Get the III SDK singleton instance.

    Creates a default instance if none exists.
    """
    global _instance
    if _instance is None:
        _instance = III(_engine_ws_url)
    return _instance


def init_iii(otel_config: dict[str, Any] | None = None) -> III:
    """Initialize the III SDK with optional OpenTelemetry configuration.

    Args:
        otel_config: Optional OpenTelemetry configuration dict.

    Returns:
        The initialized III SDK instance.
    """
    global _instance
    _instance = III(_engine_ws_url)
    return _instance
