#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import re
import subprocess
from dataclasses import dataclass
from pathlib import Path


TAG_PREFIX_BY_TARGET = {
    "iii": "iii",
    "motia": "motia",
}

CANONICAL_VERSION_FILE = {
    "iii": ("cargo", Path("engine/Cargo.toml")),
    "motia": ("json", Path("frameworks/motia/motia-js/packages/motia/package.json")),
}

MANIFESTS_BY_TARGET = {
    "iii": [
        ("cargo", Path("engine/Cargo.toml")),
        ("cargo", Path("sdk/packages/rust/iii/Cargo.toml")),
        ("json", Path("sdk/packages/node/iii/package.json")),
        ("cargo", Path("sdk/packages/python/iii/pyproject.toml"), "python"),
        ("cargo", Path("console/packages/console-rust/Cargo.toml")),
    ],
    "motia": [
        ("json", Path("frameworks/motia/motia-js/packages/motia/package.json")),
        ("cargo", Path("frameworks/motia/motia-py/packages/motia/pyproject.toml"), "python"),
    ],
}


@dataclass(frozen=True)
class ReleaseMetadata:
    version: str
    python_version: str
    is_prerelease: bool
    npm_tag: str
    tag: str


def read_cargo_version(path: Path) -> str:
    match = re.search(r'^version = "([^"]+)"$', path.read_text(encoding="utf-8"), re.MULTILINE)
    if not match:
        raise ValueError(f"could not find version in {path}")
    return match.group(1)


def write_cargo_version(path: Path, version: str) -> None:
    content = path.read_text(encoding="utf-8")
    updated, count = re.subn(
        r'^version = "([^"]+)"$',
        f'version = "{version}"',
        content,
        count=1,
        flags=re.MULTILINE,
    )
    if count != 1:
        raise ValueError(f"could not update version in {path}")
    path.write_text(updated, encoding="utf-8")


def read_json_version(path: Path) -> str:
    return json.loads(path.read_text(encoding="utf-8"))["version"]


def write_json_version(path: Path, version: str) -> None:
    data = json.loads(path.read_text(encoding="utf-8"))
    data["version"] = version
    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def read_current_version(repo_root: Path, target: str) -> str:
    file_type, relative_path = CANONICAL_VERSION_FILE[target]
    path = repo_root / relative_path
    if file_type == "cargo":
        return read_cargo_version(path)
    return read_json_version(path)


def normalize_release_base(version: str) -> str:
    return version.split("-", maxsplit=1)[0]


def bump_base_version(current_version: str, bump: str) -> str:
    major, minor, patch = [int(part) for part in normalize_release_base(current_version).split(".")]
    if bump == "major":
        return f"{major + 1}.0.0"
    if bump == "minor":
        return f"{major}.{minor + 1}.0"
    if bump == "patch":
        return f"{major}.{minor}.{patch + 1}"
    raise ValueError(f"unsupported bump type: {bump}")


def to_pep440(version: str) -> str:
    match = re.fullmatch(r"(\d+\.\d+\.\d+)-([a-z]+)\.(\d+)", version)
    if not match:
        return version

    base, label, number = match.groups()
    if label == "alpha":
        return f"{base}a{number}"
    if label == "beta":
        return f"{base}b{number}"
    if label == "rc":
        return f"{base}rc{number}"
    raise ValueError(f"unsupported prerelease label: {label}")


def next_prerelease_number(tag_prefix: str, base_version: str, label: str, existing_tags: list[str]) -> int:
    pattern = re.compile(rf"^{re.escape(tag_prefix)}/v{re.escape(base_version)}-{re.escape(label)}\.(\d+)$")
    numbers = [int(match.group(1)) for tag in existing_tags if (match := pattern.fullmatch(tag))]
    return (max(numbers) + 1) if numbers else 1


def compute_release_metadata(
    target: str,
    current_version: str,
    bump: str,
    prerelease: str,
    existing_tags: list[str],
) -> ReleaseMetadata:
    base_version = bump_base_version(current_version, bump)
    is_prerelease = prerelease != "none"

    if is_prerelease:
        prerelease_number = next_prerelease_number(TAG_PREFIX_BY_TARGET[target], base_version, prerelease, existing_tags)
        version = f"{base_version}-{prerelease}.{prerelease_number}"
        npm_tag = prerelease
    else:
        version = base_version
        npm_tag = "latest"

    return ReleaseMetadata(
        version=version,
        python_version=to_pep440(version),
        is_prerelease=is_prerelease,
        npm_tag=npm_tag,
        tag=f"{TAG_PREFIX_BY_TARGET[target]}/v{version}",
    )


def git_tags(repo_root: Path) -> list[str]:
    result = subprocess.run(
        ["git", "tag", "-l"],
        cwd=repo_root,
        check=True,
        capture_output=True,
        text=True,
    )
    return [line.strip() for line in result.stdout.splitlines() if line.strip()]


def stage_release_manifests(repo_root: Path, target: str, version: str, python_version: str) -> None:
    for manifest in MANIFESTS_BY_TARGET[target]:
        file_type, relative_path, *version_kind = manifest
        selected_version = python_version if version_kind and version_kind[0] == "python" else version
        path = repo_root / relative_path
        if file_type == "cargo":
            write_cargo_version(path, selected_version)
        elif file_type == "json":
            write_json_version(path, selected_version)
        else:
            raise ValueError(f"unsupported manifest type: {file_type}")


def write_github_output(path: Path, metadata: ReleaseMetadata, current_version: str) -> None:
    with path.open("a", encoding="utf-8") as handle:
        handle.write(f"version={metadata.version}\n")
        handle.write(f"python_version={metadata.python_version}\n")
        handle.write(f"is_prerelease={'true' if metadata.is_prerelease else 'false'}\n")
        handle.write(f"npm_tag={metadata.npm_tag}\n")
        handle.write(f"tag={metadata.tag}\n")
        handle.write(f"current={current_version}\n")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Shared release version helpers.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    compute_parser = subparsers.add_parser("compute", help="Compute release metadata from repo state.")
    compute_parser.add_argument("--repo-root", default=".")
    compute_parser.add_argument("--target", choices=sorted(TAG_PREFIX_BY_TARGET.keys()), required=True)
    compute_parser.add_argument("--bump", choices=["patch", "minor", "major"], required=True)
    compute_parser.add_argument("--prerelease", choices=["none", "alpha", "beta", "rc"], required=True)
    compute_parser.add_argument("--github-output")

    stage_parser = subparsers.add_parser("stage", help="Stage release versions into manifests.")
    stage_parser.add_argument("--repo-root", default=".")
    stage_parser.add_argument("--target", choices=sorted(MANIFESTS_BY_TARGET.keys()), required=True)
    stage_parser.add_argument("--version", required=True)
    stage_parser.add_argument("--python-version")

    return parser.parse_args()


def main() -> None:
    args = parse_args()
    repo_root = Path(args.repo_root).resolve()

    if args.command == "compute":
        current_version = read_current_version(repo_root, args.target)
        metadata = compute_release_metadata(
            target=args.target,
            current_version=current_version,
            bump=args.bump,
            prerelease=args.prerelease,
            existing_tags=git_tags(repo_root),
        )
        if args.github_output:
            write_github_output(Path(args.github_output), metadata, current_version)
        print(
            json.dumps(
                {
                    "current": current_version,
                    "version": metadata.version,
                    "python_version": metadata.python_version,
                    "is_prerelease": metadata.is_prerelease,
                    "npm_tag": metadata.npm_tag,
                    "tag": metadata.tag,
                }
            )
        )
        return

    if args.command == "stage":
        python_version = args.python_version or to_pep440(args.version)
        stage_release_manifests(repo_root, args.target, args.version, python_version)
        return

    raise ValueError(f"unsupported command: {args.command}")


if __name__ == "__main__":
    main()
