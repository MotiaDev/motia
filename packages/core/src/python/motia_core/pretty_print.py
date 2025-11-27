from typing import Any, Dict

class _C:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    GRAY = "\033[90m"
    RED = "\033[31m"
    GREEN = "\033[32m"
    YELLOW = "\033[33m"
    BLUE = "\033[34m"
    CYAN = "\033[36m"


def _bold(s: str) -> str: return f"{_C.BOLD}{s}{_C.RESET}"

def _gray(s: str) -> str: return f"{_C.GRAY}{s}{_C.RESET}"

def _red(s: str) -> str: return f"{_C.RED}{s}{_C.RESET}"

def _green(s: str) -> str: return f"{_C.GREEN}{s}{_C.RESET}"

def _yellow(s: str) -> str: return f"{_C.YELLOW}{s}{_C.RESET}"

def _blue(s: str) -> str: return f"{_C.BLUE}{s}{_C.RESET}"

def _cyan(s: str) -> str: return f"{_C.CYAN}{s}{_C.RESET}"


def _step_tag(step: str) -> str: return _bold(_cyan(step)) if step else ""

def _timestamp_tag(ts: str) -> str: return _gray(ts)

def _trace_id_tag(tid: str) -> str: return _gray(tid) if tid else ""


_LEVEL_TAGS: Dict[str, str] = {
    "error": _red("[ERROR]"),
    "info": _blue("[INFO]"),
    "warn": _yellow("[WARN]"),
    "debug": _gray("[DEBUG]"),
    "trace": _gray("[TRACE]"),
}


def _numeric_tag(v: str) -> str: return _green(v)

def _string_tag(v: str) -> str: return _cyan(v)

def _boolean_tag(v: str) -> str: return _blue(v)


_ARRAY_BRACKETS = (_gray("["), _gray("]"))
_OBJECT_BRACKETS = (_gray("{"), _gray("}"))


def _pretty_print_object(obj: Dict[str, Any], depth: int = 0, parent_is_last: bool = False, prefix: str = "") -> str:
    tab = prefix + ("" if depth == 0 else "│ ")
    if depth > 2:
        return f"{tab} └ {_gray('[...]')}"

    entries = list(obj.items())
    out_lines = []

    for idx, (key, value) in enumerate(entries):
        is_last = idx == len(entries) - 1
        is_obj = isinstance(value, dict) or isinstance(value, list)
        branch = "└" if (is_last and not is_obj) else "├"

        if isinstance(value, dict):
            sub = _pretty_print_object(value, depth + 1, is_last, tab)
            start, end = _OBJECT_BRACKETS
            out_lines.append(f"{tab}{branch} {key}: {start}\n{sub}\n{tab}{'└' if is_last else '│'} {end}")
        elif isinstance(value, list):
            as_dict = {str(i): v for i, v in enumerate(value)}
            sub = _pretty_print_object(as_dict, depth + 1, is_last, tab)
            start, end = _ARRAY_BRACKETS
            out_lines.append(f"{tab}{branch} {key}: {start}\n{sub}\n{tab}{'└' if is_last else '│'} {end}")
        else:
            printed = value
            if isinstance(value, (int, float)):
                printed = _numeric_tag(str(value))
            elif isinstance(value, bool):
                printed = _boolean_tag(str(value))
            elif isinstance(value, str):
                printed = _string_tag(value)
            out_lines.append(f"{tab}{branch} {key}: {printed}")

    return "\n".join(out_lines)


def pretty_print(json: Dict[str, Any], exclude_details: bool = False) -> None:
    time_val = json.get("time")
    trace_id = json.get("traceId", "")
    msg = json.get("msg", "")
    level = str(json.get("level", "info")).lower()
    step = json.get("step", "")

    details = {k: v for k, v in json.items() if k not in ("time", "traceId", "msg", "flows", "level", "step")}

    level_tag = _LEVEL_TAGS.get(level, _LEVEL_TAGS["info"])
    timestamp = _timestamp_tag(f"[{_fmt_time(time_val)}]")
    has_details = len(details) > 0

    line = f"{timestamp} {_trace_id_tag(str(trace_id))} {level_tag} {_step_tag(str(step))} {msg}".strip()
    print(" ".join(line.split()))

    if has_details and not exclude_details:
        print(_pretty_print_object(details))


def _fmt_time(ms: Any) -> str:
    try:
        import datetime as _dt
        dt = _dt.datetime.fromtimestamp(int(ms) / 1000.0)
        return dt.strftime("%H:%M:%S")
    except Exception:
        return "??:??:??"