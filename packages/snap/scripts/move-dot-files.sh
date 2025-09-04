#!/bin/bash

# Copy dot files to the correct location
# Get the absolute path to the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DOT_FILES_SRC="$PROJECT_ROOT/dot-files"
DIST_DIR="$SCRIPT_DIR/../dist"

echo "Script directory: $SCRIPT_DIR"
echo "Project root: $PROJECT_ROOT"
echo "Dot files source: $DOT_FILES_SRC"
echo "Dist directory: $DIST_DIR"

# Ensure dist directory exists
mkdir -p "$DIST_DIR"

# Copy dot files
if [ -d "$DOT_FILES_SRC" ]; then
    cp -r "$DOT_FILES_SRC" "$DIST_DIR/dot-files"
    echo "Successfully copied dot-files to $DIST_DIR/dot-files"
else
    echo "Error: Source directory $DOT_FILES_SRC does not exist"
    exit 1
fi
