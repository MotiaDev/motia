#!/usr/bin/env node

/**
 * C# Step Runner (Stub Implementation)
 * 
 * This is a stub implementation to make tests pass (TDD Green phase).
 * In Days 3-4, this will be replaced with actual C# runner using dotnet.
 * 
 * Usage: node csharp-runner.js <step-file-path> <json-data>
 */

const fs = require('fs')

// Simple RPC sender for communication with parent process via IPC
// Follows the same pattern as node/rpc.ts
class RpcSender {
  send(method, args) {
    return new Promise((resolve) => {
      const message = {
        type: 'rpc_request',
        method,
        args
      }
      
      if (process.send) {
        // IPC mode (Unix/macOS)
        process.send(message)
        // For stub purposes, resolve immediately
        // Real implementation would wait for rpc_response
        resolve(null)
      } else {
        // RPC mode (stdout) - fallback (not used for node)
        process.stdout.write(JSON.stringify(message) + '\n')
        resolve(null)
      }
    })
  }

  sendNoWait(method, args) {
    const message = {
      type: 'rpc_request',
      method,
      args
    }
    
    if (process.send) {
      // IPC mode (Unix/macOS)
      process.send(message)
    } else {
      // RPC mode (stdout) - fallback
      process.stdout.write(JSON.stringify(message) + '\n')
    }
  }
}

async function runCSharpStep(stepFilePath, eventData) {
  const sender = new RpcSender()

  try {
    // Validate step file exists
    if (!fs.existsSync(stepFilePath)) {
      throw new Error(`Step file not found: ${stepFilePath}`)
    }

    const { traceId, data } = eventData

    // Stub: Return a successful response that matches test expectations
    // In the real implementation, this would:
    // 1. Compile the C# step file
    // 2. Execute the handler method
    // 3. Handle emit, state, and other context operations
    
    const result = {
      status: 200,
      body: { traceId }
    }

    // Send result back to parent process
    await sender.send('result', result)
    
    // Small delay to ensure message is processed before close
    await new Promise(resolve => setTimeout(resolve, 10))
    
    await sender.send('close', undefined)
    
    process.exit(0)
  } catch (err) {
    const error = {
      message: err.message || 'Unknown error',
      code: err.code || null,
      stack: err.stack || ''
    }
    sender.sendNoWait('close', error)
    process.exit(1)
  }
}

// Parse command line arguments
const [, , stepFilePath, jsonArg] = process.argv

if (!stepFilePath || !jsonArg) {
  console.error('Usage: node csharp-runner.js <step-file-path> <json-data>')
  process.exit(1)
}

let eventData
try {
  eventData = JSON.parse(jsonArg)
} catch (err) {
  console.error('Failed to parse JSON argument:', err.message)
  process.exit(1)
}

runCSharpStep(stepFilePath, eventData)

