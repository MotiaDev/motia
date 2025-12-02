#!/bin/bash

# Copy non-compiled assets to dist
cp README.md dist/README.md
cp components.json dist/components.json
cp -r public/ dist/public

# Copy source files needed for development mode (when Vite is used)
cp index.html dist/index.html
cp -r src/assets/ dist/src/assets
cp src/index.css dist/src/index.css
cp src/components/tutorial/tutorial.css dist/src/components/tutorial/tutorial.css
cp tailwind.config.js dist/tailwind.config.js
cp postcss.config.mjs dist/postcss.config.mjs

# Replace TSX with JS for dev mode bundling
if [[ "$OSTYPE" == "darwin"* ]]; then # Mac OS X
  sed -i '' 's/main\.tsx/main.js/g' dist/index.html
else # Linux and others
  sed -i 's/main\.tsx/main.js/g' dist/index.html
fi

# Note: The pre-built client assets are in dist/client/ (created by vite build)
