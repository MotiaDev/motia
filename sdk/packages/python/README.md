# Python Packages

This directory contains Python packages for the III Engine.

## Packages

### iii

The core SDK for communicating with the III Engine via WebSocket. The package is installed as `iii-sdk`.

```bash
cd iii
pip install -e .
```

## Examples

### iii-example

Basic example demonstrating the III SDK.

```bash
cd iii-example
uv sync
uv run python -m src.main
```

Prerequisite: the worker expects a III engine at `III_BRIDGE_URL` (default `ws://localhost:49134`) and Redis for the stream/event modules configured in `iii-example/config.yaml`.

## Development

### Install package in development mode

```bash
pip install -e iii
```

### Type checking

```bash
cd iii && mypy src
```

### Linting

```bash
cd iii && ruff check src
```
