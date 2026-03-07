#!/usr/bin/env sh
set -eu

REPO="${REPO:-iii-hq/iii}"
BIN_NAME="${BIN_NAME:-iii}"
CLI_INSTALL_URL="${CLI_INSTALL_URL:-https://install.iii.dev/iii-cli/main/install.sh}"

err() {
  echo "error: $*" >&2
  exit 1
}

install_cli() {
  echo ""
  echo "installing iii cli..."

  cli_tmpdir=$(mktemp -d 2>/dev/null || mktemp -d -t iii-cli-install)
  cli_script="$cli_tmpdir/install-cli.sh"

  if ! curl -fsSL "$CLI_INSTALL_URL" -o "$cli_script"; then
    echo "warning: failed to download CLI installer, skipping" >&2
    rm -rf "$cli_tmpdir"
    return 1
  fi

  chmod +x "$cli_script"

  cli_sh_args=""
  if [ -n "$cli_version" ]; then
    cli_sh_args="-v $cli_version"
  fi

  if [ -n "$cli_dir" ]; then
    # shellcheck disable=SC2086
    INSTALL_DIR="$cli_dir" sh "$cli_script" $cli_sh_args
  else
    # shellcheck disable=SC2086
    sh "$cli_script" $cli_sh_args
  fi

  cli_exit=$?
  rm -rf "$cli_tmpdir"
  return $cli_exit
}

# --- Argument parsing ---
no_cli=false
cli_version=""
cli_dir=""
engine_version="${VERSION:-}"

while [ $# -gt 0 ]; do
  case "$1" in
    --no-cli)
      no_cli=true
      shift
      ;;
    --cli-version)
      if [ $# -lt 2 ]; then
        err "--cli-version requires a value"
      fi
      cli_version="$2"
      shift 2
      ;;
    --cli-dir)
      if [ $# -lt 2 ]; then
        err "--cli-dir requires a value"
      fi
      cli_dir="$2"
      shift 2
      ;;
    -h|--help)
      cat <<'USAGE'
Usage: install.sh [OPTIONS] [VERSION]

Install the iii engine and CLI.

Options:
  --no-cli              Skip CLI installation
  --cli-version VER     Install specific CLI version
  --cli-dir DIR         Install CLI to specific directory
  -h, --help            Show this help message

Environment variables:
  VERSION               Engine version to install
  BIN_DIR               Engine binary installation directory
  PREFIX                Installation prefix (used if BIN_DIR not set)
  TARGET                Override target triple
  III_USE_GLIBC         Use glibc build on Linux x86_64
  CLI_INSTALL_URL       Override CLI install script URL
USAGE
      exit 0
      ;;
    -*)
      err "unknown option: $1 (use --help for usage)"
      ;;
    *)
      if [ -z "$engine_version" ]; then
        engine_version="$1"
      fi
      shift
      ;;
  esac
done

VERSION="$engine_version"

if ! command -v curl >/dev/null 2>&1; then
  err "curl is required"
fi

if [ -n "${TARGET:-}" ]; then
  target="$TARGET"
else
  uname_s=$(uname -s 2>/dev/null || echo unknown)
  uname_m=$(uname -m 2>/dev/null || echo unknown)

  case "$uname_m" in
    x86_64|amd64)
      arch="x86_64"
      ;;
    arm64|aarch64)
      arch="aarch64"
      ;;
    armv7*)
      arch="armv7"
      ;;
    *)
      err "unsupported architecture: $uname_m"
      ;;
  esac

  case "$uname_s" in
    Darwin)
      os="apple-darwin"
      ;;
    Linux)
      case "$arch" in
        x86_64)
          if [ -n "${III_USE_GLIBC:-}" ]; then
            sys_glibc=$(ldd --version 2>&1 | head -n 1 | grep -oE '[0-9]+\.[0-9]+$' || echo "0.0")
            required_glibc="2.35"
            if printf '%s\n%s\n' "$required_glibc" "$sys_glibc" | sort -V -C; then
              os="unknown-linux-gnu"
              echo "using glibc build (system glibc: $sys_glibc)"
            else
              echo "warning: system glibc $sys_glibc is older than required $required_glibc, falling back to musl" >&2
              os="unknown-linux-musl"
            fi
          else
            os="unknown-linux-musl"
          fi
          ;;
        aarch64)
          os="unknown-linux-gnu"
          ;;
        armv7)
          os="unknown-linux-gnueabihf"
          ;;
      esac
      ;;
    *)
      err "unsupported OS: $uname_s"
      ;;
  esac

  target="$arch-$os"
fi

api_headers="-H Accept:application/vnd.github+json -H X-GitHub-Api-Version:2022-11-28"
github_api() {
  # shellcheck disable=SC2086
  curl -fsSL $api_headers "$1"
}

TAG_PREFIX="v"

if [ -n "$VERSION" ]; then
  echo "installing version: $VERSION"
  _ver="${VERSION#iii/}"
  _ver="${_ver#v}"
  _tag="${TAG_PREFIX}${_ver}"
  api_url="https://api.github.com/repos/$REPO/releases/tags/${_tag}"
  json=$(github_api "$api_url") || err "release tag not found: $VERSION (tried tag: ${_tag})"
else
  echo "installing latest version"
  api_url="https://api.github.com/repos/$REPO/releases?per_page=20"
  json_list=$(github_api "$api_url")
  if command -v jq >/dev/null 2>&1; then
    json=$(printf '%s' "$json_list" \
      | jq -c 'first(.[] | select(.prerelease == false and (.tag_name | startswith("v"))))')
    if [ "$json" = "null" ] || [ -z "$json" ]; then
      err "no stable iii release found"
    fi
  else
    _tag=$(printf '%s' "$json_list" \
      | grep -oE '"tag_name"[[:space:]]*:[[:space:]]*"v[^"]+"' \
      | head -n 1 \
      | sed -E 's/.*"(v[^"]+)".*/\1/')
    if [ -z "$_tag" ]; then
      err "could not determine latest release"
    fi
    api_url="https://api.github.com/repos/$REPO/releases/tags/${_tag}"
    json=$(github_api "$api_url")
  fi
fi

if command -v jq >/dev/null 2>&1; then
  asset_url=$(printf '%s' "$json" \
    | jq -r --arg bn "$BIN_NAME" --arg target "$target" \
      '.assets[] | select((.name | startswith($bn + "-")) and (.name | contains($target)) and (.name | test("\\.(tar\\.gz|tgz|zip)$"))) | .browser_download_url' \
    | head -n 1)
else
  asset_url=$(printf '%s' "$json" \
    | grep -oE '"browser_download_url"[[:space:]]*:[[:space:]]*"[^"]+"' \
    | sed -E 's/.*"([^"]+)".*/\1/' \
    | grep -F "$BIN_NAME-$target" \
    | grep -E '\.(tar\.gz|tgz|zip)$' \
    | head -n 1)
fi

if [ -z "$asset_url" ]; then
  echo "available assets:" >&2
  printf '%s' "$json" \
    | grep -oE '"browser_download_url"[[:space:]]*:[[:space:]]*"[^"]+"' \
    | sed -E 's/.*"([^"]+)".*/\1/' >&2
  err "no release asset found for target: $target"
fi

asset_name=$(basename "$asset_url")

if [ -z "${BIN_DIR:-}" ]; then
  if [ -n "${PREFIX:-}" ]; then
    bin_dir="$PREFIX/bin"
  else
    bin_dir="$HOME/.local/bin"
  fi
else
  bin_dir="$BIN_DIR"
fi

mkdir -p "$bin_dir"

tmpdir=$(mktemp -d 2>/dev/null || mktemp -d -t iii-install)
cleanup() {
  rm -rf "$tmpdir"
}
trap cleanup EXIT INT TERM

curl -fsSL -L "$asset_url" -o "$tmpdir/$asset_name"

case "$asset_name" in
  *.tar.gz|*.tgz)
    tar -xzf "$tmpdir/$asset_name" -C "$tmpdir"
    ;;
  *.zip)
    if ! command -v unzip >/dev/null 2>&1; then
      err "unzip is required to extract $asset_name"
    fi
    unzip -q "$tmpdir/$asset_name" -d "$tmpdir"
    ;;
  *)
    ;;
 esac

if [ -f "$tmpdir/$BIN_NAME" ]; then
  bin_file="$tmpdir/$BIN_NAME"
else
  bin_file=$(find "$tmpdir" -type f \( -name "$BIN_NAME" -o -name "${BIN_NAME}.exe" \) | head -n 1)
fi

if [ -z "${bin_file:-}" ] || [ ! -f "$bin_file" ]; then
  err "binary not found in downloaded asset"
fi

if command -v install >/dev/null 2>&1; then
  install -m 755 "$bin_file" "$bin_dir/$BIN_NAME"
else
  cp "$bin_file" "$bin_dir/$BIN_NAME"
  chmod 755 "$bin_dir/$BIN_NAME"
fi

printf 'installed %s to %s\n' "$BIN_NAME" "$bin_dir/$BIN_NAME"

# Install CLI unless --no-cli was passed
if [ "$no_cli" = false ]; then
  if ! install_cli; then
    echo "warning: CLI installation failed, but engine was installed successfully" >&2
  fi
fi

case ":$PATH:" in
  *":$bin_dir:"*)
    ;;
  *)
    printf 'add %s to your PATH if needed\n' "$bin_dir"
    ;;
 esac

echo ""
echo "If you're new to iii, get started quickly here: https://iii.dev/docs/tutorials/quickstart"
