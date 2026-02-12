# Motia Example

This example demonstrates the Motia framework with a Todo application workflow.

## Quick Start

### 1. Install uv

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### 2. Enter the project folder

```bash
cd motia-example
```

### 3. Create virtual environment

```bash
uv venv
source .venv/bin/activate  # Linux/Mac
# or .venv\Scripts\activate  # Windows
```

### 4. Install dependencies

```bash
uv pip install -r pyproject.toml
```

### 5. Run the example

```bash
motia run
```

## Project Structure

```
motia-example/
├── pyproject.toml          # Project configuration with dependencies
├── README.md               # This file
└── steps/                  # Step definitions
    ├── __init__.py
    ├── test_conditions.step.py
    ├── test_multi_trigger.step.py
    └── todo/               # Todo application steps
        ├── __init__.py
        ├── create_todo.step.py
        ├── delete_todo.step.py
        └── update_todo.step.py
```

## What This Example Does

This example showcases Motia's event-driven workflow capabilities with a simple Todo application:

- **Event Steps**: React to events like `todo.created`, `todo.updated`, `todo.deleted`
- **API Steps**: Expose REST endpoints for CRUD operations
- **Stream State**: Manage todo items using Motia's stream-based state management
- **Multi-trigger Steps**: Handle multiple event types in a single step
- **Conditional Logic**: Demonstrate conditional step execution

## Documentation

For more information on the Motia framework, see:

- [Motia README](../motia/README.md)
- [III SDK README](../iii/README.md)
