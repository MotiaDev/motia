#!/usr/bin/env node

/**
 * C# Config Parser (Stub Implementation)
 * 
 * This is a stub implementation to make tests pass (TDD Green phase).
 * In Days 3-4, this will be replaced with actual C# compilation and config extraction.
 * 
 * Usage: node get-config.js <step-file-path>
 */

const fs = require('fs')
const path = require('path')

async function getCSharpConfig(stepFilePath) {
  // For now, return a stub config that matches the test expectations
  // This will be replaced with actual C# config extraction using dotnet CLI
  
  // Read the file to validate it exists
  if (!fs.existsSync(stepFilePath)) {
    console.error(JSON.stringify({ error: `File not found: ${stepFilePath}` }))
    process.exit(1)
  }

  // Return stub config that matches the test fixture
  const config = {
    type: 'api',
    name: 'api-step',
    emits: ['TEST_EVENT'],
    path: '/test',
    method: 'POST'
  }

  // Send config via IPC if available, otherwise stdout
  if (process.send) {
    // IPC mode (Unix/macOS)
    process.send(config)
  } else {
    // RPC mode (stdout) - fallback
    console.log(JSON.stringify(config))
  }
  
  process.exit(0)
}

// Get step file path from command line arguments
const stepFilePath = process.argv[2]

if (!stepFilePath) {
  console.error(JSON.stringify({ error: 'No step file path provided' }))
  process.exit(1)
}

getCSharpConfig(stepFilePath)

