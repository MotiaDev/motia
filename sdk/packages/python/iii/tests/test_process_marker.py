import json
import os
from pathlib import Path

from iii.process_marker import announce_process


def test_marker_names_this_process_until_removed(tmp_path: Path) -> None:
    marker = tmp_path / f"worker-{os.getpid()}.json"

    remove = announce_process("ws://127.0.0.1:49134", "orders", tmp_path)
    written = json.loads(marker.read_text())
    assert written["pid"] == os.getpid()
    assert written["url"] == "ws://127.0.0.1:49134"
    assert written["name"] == "orders"
    assert written["sdk"] == "python"

    remove()
    assert not marker.exists()


def test_unwritable_directory_is_not_an_error(tmp_path: Path) -> None:
    blocker = tmp_path / "file"
    blocker.write_text("")
    announce_process("ws://x", "y", blocker / "run")()
