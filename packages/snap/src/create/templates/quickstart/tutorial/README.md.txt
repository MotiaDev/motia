# Quickstart Tutorial

This folder contains the interactive code walkthrough tutorial for Motia quickstart.

## Overview

The tutorial system provides an interactive walkthrough of `typescript.step.ts`, teaching users the fundamentals of Motia steps through a guided code exploration experience.

## Features

- **Auto-start**: Tutorial begins immediately when loaded
- **Welcome Screen**: Introduces users to Motia before diving into code
- **Code View**: Side-by-side code and tutorial panels
- **Collapsible Comments**: Comment blocks expand/collapse per step to reduce noise
- **Focus & Fade**: Relevant code is highlighted while other parts fade
- **Keyboard Navigation**: Arrow keys, Space, Enter, and Escape for navigation
- **Progress Tracking**: Visual progress bar and step counter

## Files

- `walkthrough-config.json` - Configuration for tutorial steps, line references, and comments
- `walkthrough.tsx` - Registers the walkthrough with the workbench

## Configuration

The `walkthrough-config.json` file controls the entire tutorial. It references specific line numbers from `src/typescript.step.ts`:

### Steps Configuration

Each step in the `steps` array defines:

```json
{
  "id": "unique-step-id",
  "title": "Step Title",
  "description": "HTML description with <b>bold</b> and <code>code</code> support",
  "focusLines": [18, 19, 20],
  "expandComments": ["config-options"],
  "collapseComments": ["handler-comment"]
}
```

- `focusLines`: Line numbers to highlight (empty = all visible)
- `expandComments`: Comment IDs to expand for this step
- `collapseComments`: Comment IDs to collapse for this step

### Comments Configuration

Define collapsible comment blocks by line number:

```json
{
  "config-options": {
    "startLine": 8,
    "endLine": 16,
    "collapsedText": "// Config types..."
  }
}
```

## Usage

The walkthrough automatically registers when the tutorial file is loaded. The workbench will display it if `autoStart` is true and the user hasn't dismissed it.

## Deleting the Tutorial

You can safely delete this folder if you don't need the tutorial anymore.

To restart the tutorial in a new project:
```bash
pnpx motia@latest --quickstart
```
