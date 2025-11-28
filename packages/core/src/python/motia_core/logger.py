import os
import time
from typing import Callable, Dict, Any, Optional, List
from .pretty_print import pretty_print

LOG_LEVEL = os.getenv("LOG_LEVEL", "info").lower()

_is_debug_enabled = LOG_LEVEL == "debug"
_is_info_enabled = LOG_LEVEL in ("info", "debug")
_is_warn_enabled = LOG_LEVEL in ("warn", "info", "debug", "trace")

LogListener = Callable[[str, str, Optional[Dict[str, Any]]], None]

class Logger:
    def __init__(
        self,
        is_verbose: bool = False,
        meta: Optional[Dict[str, Any]] = None,
        core_listeners: Optional[List[LogListener]] = None,
    ) -> None:
        self.is_verbose = is_verbose
        self._meta = dict(meta or {})
        self._core_listeners: List[LogListener] = list(core_listeners or [])
        self._listeners: List[LogListener] = []

    def child(self, meta: Dict[str, Any]) -> "Logger":
        merged = {**self._meta, **(meta or {})}
        return Logger(self.is_verbose, merged, self._core_listeners)

    def _log(self, level: str, msg: str, args: Optional[Dict[str, Any]] = None) -> None:
        now_ms = int(time.time() * 1000)
        meta = {**self._meta, **(args or {})}
        pretty_print({"level": level, "time": now_ms, "msg": msg, **meta}, exclude_details=not self.is_verbose)

        for listener in self._core_listeners:
            listener(level, msg, meta)
        for listener in self._listeners:
            listener(level, msg, meta)

    def info(self, message: str, args: Optional[Dict[str, Any]] = None) -> None:
        if _is_info_enabled:
            self._log("info", message, args)

    def error(self, message: str, args: Optional[Dict[str, Any]] = None) -> None:
        self._log("error", message, args)

    def debug(self, message: str, args: Optional[Dict[str, Any]] = None) -> None:
        if _is_debug_enabled:
            self._log("debug", message, args)

    def warn(self, message: str, args: Optional[Dict[str, Any]] = None) -> None:
        if _is_warn_enabled:
            self._log("warn", message, args)

    def log(self, args: Dict[str, Any]) -> None:
        msg = str(args.get("msg", ""))
        self._log("info", msg, args)

    def add_listener(self, listener: LogListener) -> None:
        self._listeners.append(listener)