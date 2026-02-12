"""III SDK client instance for Motia framework."""

import os

from iii import III

bridge = III(os.environ.get("III_BRIDGE_URL", "ws://localhost:49134"))
