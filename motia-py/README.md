# Python Packages

This directory contains Python packages for the III Engine.

## Quick Start

```bash
# Install uv (if not installed)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Clone and run the example
cd motia-example
uv venv
source .venv/bin/activate
uv pip install -r pyproject.toml
```

## Packages

### iii

The core SDK for communicating with the III Engine via WebSocket.

```bash
cd iii
uv pip install -e .
```

### motia

High-level framework for building workflows with the III Engine.

```bash
cd motia
uv pip install -e .
```

## Examples

### iii-example

Basic example demonstrating the III SDK.

```bash
cd iii-example
uv pip install -e ../iii
python src/main.py
```

### motia-example

Example demonstrating the Motia framework with a Todo application.

```bash
cd motia-example
uv pip install -e ../iii -e ../motia
motia run --dir steps
```

## Development

### Install all packages in development mode

```bash
uv pip install -e iii -e motia
```

### Run tests

```bash
cd iii && pytest
cd motia && pytest
```

### Type checking

```bash
cd iii && mypy src
cd motia && mypy src
```

### Linting

```bash
cd iii && ruff check src
cd motia && ruff check src
```
