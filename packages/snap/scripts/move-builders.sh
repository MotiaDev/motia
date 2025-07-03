#!/bin/bash

# Copy Python files to both CJS and ESM directories
cp src/cloud/build/builders/python/python-builder.py dist/cjs/cloud/build/builders/python/python-builder.py
cp src/cloud/build/builders/python/python-builder.py dist/esm/cloud/build/builders/python/python-builder.py
cp src/cloud/build/builders/node/router.ts dist/cjs/cloud/build/builders/node/router.ts
cp src/cloud/build/builders/node/router.ts dist/esm/cloud/build/builders/node/router.ts
cp src/cloud/build/builders/python/router.py dist/cjs/cloud/build/builders/python/router.py
cp src/cloud/build/builders/python/router.py dist/esm/cloud/build/builders/python/router.py

# Copy core requirements.txt
cp ../core/requirements.txt dist/requirements-core.txt
cp requirements.txt dist/requirements-snap.txt