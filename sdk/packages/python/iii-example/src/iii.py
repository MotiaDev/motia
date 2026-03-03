import os

from iii import III, InitOptions

engine_ws_url = os.environ.get("III_BRIDGE_URL", "ws://localhost:49134")

iii = III(address=engine_ws_url, options=InitOptions(worker_name="iii-example"))
