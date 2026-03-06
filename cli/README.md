# iii-cli

A unified command dispatcher for iii-engine tools. Automatically downloads and manages multiple binaries (iii-console, iii-tools) from GitHub, with built-in update checking and security advisories.

## Install

```bash
curl -fsSL https://install.iii.dev/iii-cli/main/install.sh | bash
```

Specific version:
```bash
curl -fsSL https://install.iii.dev/iii-cli/main/install.sh | bash -s -- -v VERSION_NUMBER
```

Custom directory:
```bash
curl -fsSL https://install.iii.dev/iii-cli/main/install.sh | INSTALL_DIR=/usr/local/bin bash
```

The script auto-detects your platform, downloads the correct binary, verifies the SHA256 checksum, and adds it to your `PATH`.

### Manual download

Download the latest release binary from the [Releases](https://github.com/iii-hq/iii-cli/releases) page.

| Platform | Target |
|----------|--------|
| macOS (Apple Silicon) | `aarch64-apple-darwin` |
| macOS (Intel) | `x86_64-apple-darwin` |
| Linux (x86_64, glibc) | `x86_64-unknown-linux-gnu` |
| Linux (x86_64, musl) | `x86_64-unknown-linux-musl` |
| Linux (ARM64) | `aarch64-unknown-linux-gnu` |
| Windows (x86_64) | `x86_64-pc-windows-msvc` |
| Windows (ARM64) | `aarch64-pc-windows-msvc` |

Each release includes `.sha256` checksum files for verification.

### macOS Gatekeeper

macOS blocks unsigned binaries downloaded from the internet. Remove the quarantine attribute:

```bash
xattr -d com.apple.quarantine ./iii-cli
```

### From Cargo

```bash
cargo install --path .
```

### Build from Source

```bash
git clone https://github.com/iii-hq/iii-cli.git
cd iii-cli
cargo build --release
./target/release/iii-cli --help
```

## Features

- **Unified dispatcher**: Single command to launch all iii-engine tools
- **Automatic downloads**: Fetches latest stable releases from GitHub on first use
- **Smart binary detection**: Checks managed directory, ~/.local/bin/, and system PATH before downloading
- **Progress tracking**: Visual download progress with speed and time estimates
- **SHA256 verification**: Validates binary integrity for supported releases
- **Update checking**: Background checks for newer versions (non-blocking, 500ms timeout)
- **Security advisories**: Warns about critical updates matching installed versions
- **Cross-platform**: macOS (Apple Silicon + Intel), Linux (x86_64 musl + ARM64 gnu), Windows (x86_64 + ARM64)
- **Platform-aware storage**: Uses standard data directories for each OS
- **POSIX exec on Unix**: Replaces process entirely for full terminal ownership (critical for interactive tools)

## Usage

### Launch iii-console

Launch the iii-engine web console:

```bash
iii-cli console [ARGS]
```

The console will auto-download on first use. Pass any arguments directly to iii-console:

```bash
iii-cli console --port 3000
```

### Create Project

Create a new iii project from a template:

```bash
iii-cli create [ARGS]
```

Examples:

```bash
iii-cli create --template my-template
iii-cli create my-project --help
```

### List Installed Binaries

Show all managed binaries and their versions:

```bash
iii-cli list
```

Output example:

```
  Installed binaries:

  • iii-console (v0.2.4) — installed 2026-02-25 — command: iii-cli console
  • iii-tools (v1.0.2) — installed 2026-02-20 — command: iii-cli create

  Storage: /Users/user/Library/Application Support/iii-cli/bin
```

### Update Binaries

Update iii-cli and all installed binaries to their latest versions:

```bash
iii-cli update
```

Update only iii-cli itself:

```bash
iii-cli update self
iii-cli update iii-cli
```

Update a specific managed binary:

```bash
iii-cli update console
iii-cli update create
```

### Disable Update Checks

Skip background update and advisory checks for a single command:

```bash
iii-cli --no-update-check console
```

## How Auto-Download Works

When you run a command like `iii-cli console`:

1. **Check managed directory**: Looks in platform-specific data directory (e.g., `~/Library/Application Support/iii-cli/bin/` on macOS)
2. **Check system locations**: Searches `~/.local/bin/` and system `$PATH` for existing installations
3. **Download if needed**: If binary not found, fetches latest stable release from GitHub with a progress bar
4. **Verify checksum**: Validates SHA256 checksum (when available) to ensure integrity
5. **Extract and store**: Extracts binary and stores atomically in managed directory
6. **Execute**: Launches the binary with process replacement (Unix) or spawning (Windows)

The entire download happens transparently on first use. Subsequent runs use the cached binary.

## Update Checking

After each command execution, iii-cli runs a **non-blocking background check** (500ms timeout):

- Checks GitHub for newer releases of installed binaries
- Displays informational messages (does not interrupt execution)
- Only checks once every 24 hours per binary
- Silently times out if GitHub is slow

Example output:

```
  info: Update available: iii-console v0.2.3 → v0.2.4 (run `iii-cli update console`)
```

To run an explicit update check without executing a command:

```bash
iii-cli update
```
## Platform Support

| Platform | Architectures | Status |
|----------|---------------|--------|
| **macOS** | Apple Silicon (aarch64), Intel (x86_64) | Fully supported |
| **Linux** | x86_64 (musl), ARM64 (gnu) | Fully supported |
| **Windows** | x86_64, ARM64 | Fully supported |

**Linux note**: x86_64 uses musl for maximum portability; aarch64 uses gnu (musl builds unavailable).

## Development

### Building

```bash
cargo build
cargo build --release
```

### Running Tests

```bash
cargo test
```

### Test Coverage

The project includes unit tests for:
- Command resolution and registry
- Platform detection and asset naming
- State persistence (save/load roundtrip)
- Update checking and notification formatting
- Advisory matching and severity display
- Checksum computation and verification
- Binary extraction from tar.gz and zip archives

### Code Organization

- `src/main.rs` - Entry point, command dispatch, and lifecycle
- `src/cli.rs` - CLI argument parsing with clap
- `src/registry.rs` - Binary registry and command resolution
- `src/platform.rs` - Platform detection, asset naming, directory management
- `src/update.rs` - Update checking and version comparison
- `src/advisory.rs` - Security advisory fetching and matching
- `src/download.rs` - Asset download with progress, checksum verification, extraction
- `src/exec.rs` - Binary execution (POSIX exec on Unix, spawn on Windows)
- `src/state.rs` - Persistent state management
- `src/github.rs` - GitHub API client
- `src/error.rs` - Error types

### Dependencies

Core dependencies:
- **clap 4** - CLI argument parsing
- **tokio** - Async runtime
- **reqwest** - HTTP client with rustls-tls for security
- **indicatif** - Progress bars
- **semver** - Version comparison
- **chrono** - Timestamps and time operations
- **flate2/tar** - tar.gz extraction
- **zip** - zip extraction (Windows)
- **sha2** - SHA256 checksums
- **dirs** - Standard directory paths
- **colored** - Colored output
- **thiserror** - Error handling

## License

Apache-2.0

## Contributing

To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `cargo test`
5. Submit a pull request

## Troubleshooting

### Binary not found after download

If you see "Binary not found" after a download:

```
error: Binary not found at /path/to/binary
```

Try running the command again. The binary may be in a temporary location during extraction.

### Checksum mismatch

If you see a checksum mismatch:

```
error: SHA256 checksum mismatch for asset. Expected: ..., got: ...
```

The downloaded file may be corrupted. Run the command again to re-download.

### Rate limit exceeded

If you see rate limit errors:

```
error: GitHub API rate limit exceeded
```

Set a GitHub token:

```bash
export GITHUB_TOKEN=ghp_your_token_here
iii-cli update
```

### Update check timeout

Update checks run with a 500ms timeout. If GitHub is slow, the check is skipped silently and will retry on the next command. To force an update check:

```bash
iii-cli update
```

### Existing binary detection

If iii-cli finds an existing installation instead of downloading:

```
✓ Found existing iii-console at /usr/local/bin/iii-console
```

This is expected. iii-cli checks `~/.local/bin/` and system `$PATH` before downloading to avoid redundant downloads. To use iii-cli's managed version:

```bash
rm /usr/local/bin/iii-console
iii-cli console  # Will re-download to managed directory
```
