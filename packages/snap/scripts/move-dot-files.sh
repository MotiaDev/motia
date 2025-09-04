#!/bin/bash

mkdir -p dist/cjs/cursor-rules/dot-files
mkdir -p dist/esm/cursor-rules/dot-files

cp -r src/cursor-rules/dot-files/* dist/cjs/cursor-rules/dot-files/
cp -r src/cursor-rules/dot-files/* dist/esm/cursor-rules/dot-files/

cp -r src/cursor-rules/dot-files/.cursor dist/cjs/cursor-rules/dot-files/.cursor
cp -r src/cursor-rules/dot-files/.cursor dist/esm/cursor-rules/dot-files/.cursor

cp -r src/cursor-rules/dot-files/.claude dist/cjs/cursor-rules/dot-files/.claude
cp -r src/cursor-rules/dot-files/.claude dist/esm/cursor-rules/dot-files/.claude
