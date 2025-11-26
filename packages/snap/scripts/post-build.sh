#!/bin/bash

# Post-build script: Consolidates all post-build operations
# This script is called after the vite build completes

copy_templates() {
    local src_dir="$1"
    local dest_dir="$2"

    # Create the destination directory if it doesn't exist
    mkdir -p "$dest_dir"

    # Copy all non folder files while preserving the directory structure
    find -L "$src_dir" -type f | while read -r file; do
        # Get the relative path of the file
        rel_path="${file#$src_dir/}"
        # Create the destination directory for the file
        mkdir -p "$dest_dir/$(dirname "$rel_path")"
        # Copy the file to the destination directory
        cp "$file" "$dest_dir/$rel_path"
    done

    echo "All files from $src_dir have been copied successfully to $dest_dir."
}

echo "Running post-build operations..."

# ========================================
# Copy Templates
# ========================================
echo "Copying templates..."

# Define source and destination directories
CREATE_TEMPLATES_SRC_DIR="$(dirname "$0")/../src/create/templates"

# Copy templates to dist directory
CREATE_TEMPLATES_DEST_DIR="$(dirname "$0")/../dist/create/templates"
copy_templates "$CREATE_TEMPLATES_SRC_DIR" "$CREATE_TEMPLATES_DEST_DIR"

CREATE_STEP_TEMPLATES_SRC_DIR="$(dirname "$0")/../src/create-step/templates"

# Copy step templates to dist directory
CREATE_STEP_TEMPLATES_DEST_DIR="$(dirname "$0")/../dist/create-step/templates"
copy_templates "$CREATE_STEP_TEMPLATES_SRC_DIR" "$CREATE_STEP_TEMPLATES_DEST_DIR"

# Copy docker templates
DOCKER_TEMPLATES_SRC_DIR="$(dirname "$0")/../src/docker/templates"
DOCKER_TEMPLATES_DEST_DIR="$(dirname "$0")/../dist/docker/templates"

copy_templates "$DOCKER_TEMPLATES_SRC_DIR" "$DOCKER_TEMPLATES_DEST_DIR"

# ========================================
# Copy Builders
# ========================================
echo "Copying builders..."

# Copy Python files to dist directory
cp src/cloud/build/builders/node/router-template.ts dist/cloud/build/builders/node/router-template.ts
cp src/cloud/build/builders/python/router_template.py dist/cloud/build/builders/python/router_template.py

# Copy core requirements.txt
cp ../core/requirements.txt dist/requirements-core.txt
cp requirements.txt dist/requirements-snap.txt

# ========================================
# Copy Dot Files
# ========================================
echo "Copying dot files..."

mkdir -p dist/cursor-rules/dot-files

cp -r src/cursor-rules/dot-files/* dist/cursor-rules/dot-files/

cp -r src/cursor-rules/dot-files/.cursor dist/cursor-rules/dot-files/.cursor

cp -r src/cursor-rules/dot-files/.claude dist/cursor-rules/dot-files/.claude

# ========================================
# Set Executable Permissions
# ========================================
echo "Making CLI files executable..."
chmod +x dist/cli.mjs

echo "Post-build operations completed successfully!"

