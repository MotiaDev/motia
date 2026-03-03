import os

from iii import III, InitOptions, init

engine_ws_url = os.environ.get("III_BRIDGE_URL", "ws://localhost:49134")

_iii: III | None = None


def init_iii() -> III:
    global _iii
    if _iii is None:
        _iii = init(
            address=engine_ws_url,
            options=InitOptions(
                worker_name="iii-example",
                otel={"enabled": True, "service_name": "iii-example"},
            ),
        )
    return _iii


def get_iii() -> III:
    if _iii is None:
        raise RuntimeError("III client is not initialized. Call init_iii() from an active async context first.")
    return _iii
