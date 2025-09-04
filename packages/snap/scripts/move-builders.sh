#!/bin/bash

# Copy Python files to both CJS and ESM directories
cp src/cloud/build/builders/node/router-template.ts dist/cjs/cloud/build/builders/node/router-template.ts
cp src/cloud/build/builders/node/router-template.ts dist/esm/cloud/build/builders/node/router-template.ts
cp src/cloud/build/builders/python/router_template.py dist/cjs/cloud/build/builders/python/router_template.py
cp src/cloud/build/builders/python/router_template.py dist/esm/cloud/build/builders/python/router_template.py

# Copy core requirements.txt
cp ../core/requirements.txt dist/requirements-core.txt
cp requirements.txt dist/requirements-snap.txt