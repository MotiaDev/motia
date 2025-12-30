#!/bin/bash

# Run all stress tests sequentially
# Usage: ./run-all.sh [rate] [duration] [base_url]
#
# Arguments:
#   rate      - Requests per second (default: 50)
#   duration  - Test duration (default: 30s)
#   base_url  - Base URL of the server (default: http://localhost:3000)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Default configuration
RATE="${1:-50}"
DURATION="${2:-30s}"
BASE_URL="${3:-http://localhost:3000}"

echo ""
echo "########################################"
echo "#   Running All Stress Tests"
echo "########################################"
echo ""
echo "Configuration:"
echo "  Rate:     ${RATE} req/s"
echo "  Duration: ${DURATION}"
echo "  Base URL: ${BASE_URL}"
echo ""

# Run Parallel Merge test
echo ">>> Running Parallel Merge stress test..."
echo ""
"$SCRIPT_DIR/run-parallel-merge.sh" "$RATE" "$DURATION" "$BASE_URL"

echo ""
echo "----------------------------------------"
echo ""

# Run RBAC Stream test (TypeScript stream)
echo ">>> Running RBAC Stream (TypeScript) stress test..."
echo ""
"$SCRIPT_DIR/run-rbac-stream.sh" "$RATE" "$DURATION" "$BASE_URL" "rbac_message"

echo ""
echo "----------------------------------------"
echo ""

# Run RBAC Stream test (Python stream)
echo ">>> Running RBAC Stream (Python) stress test..."
echo ""
"$SCRIPT_DIR/run-rbac-stream.sh" "$RATE" "$DURATION" "$BASE_URL" "rbac_message_python"

echo ""
echo "########################################"
echo "#   All Stress Tests Complete!"
echo "########################################"
echo ""
echo "Results saved in: $(dirname "$SCRIPT_DIR")/results/"



