#!/bin/bash

# Stress test for the RBAC Stream endpoint
# Usage: ./run-rbac-stream.sh [rate] [duration] [base_url] [stream_name]
#
# Arguments:
#   rate        - Requests per second (default: 50)
#   duration    - Test duration (default: 30s)
#   base_url    - Base URL of the server (default: http://localhost:3000)
#   stream_name - Stream name: rbac_message or rbac_message_python (default: rbac_message)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Default configuration
RATE="${1:-50}"
DURATION="${2:-30s}"
BASE_URL="${3:-http://localhost:3000}"
STREAM_NAME="${4:-rbac_message}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RESULTS_DIR="$ROOT_DIR/results"
OUTPUT_PREFIX="$RESULTS_DIR/rbac-stream_${TIMESTAMP}"

# Check if vegeta is installed
if ! command -v vegeta &> /dev/null; then
    echo "Error: vegeta is not installed."
    echo "Install it with: brew install vegeta (macOS) or go install github.com/tsenart/vegeta/v12@latest"
    exit 1
fi

# Check if jq is installed (for dynamic target generation)
if ! command -v jq &> /dev/null; then
    echo "Error: jq is not installed."
    echo "Install it with: brew install jq (macOS) or apt-get install jq (Linux)"
    exit 1
fi

# Ensure results directory exists
mkdir -p "$RESULTS_DIR"

echo "============================================"
echo "  RBAC Stream Stress Test"
echo "============================================"
echo "Target:     POST ${BASE_URL}/rbac-stream/:threadId"
echo "Stream:     ${STREAM_NAME}"
echo "Rate:       ${RATE} req/s"
echo "Duration:   ${DURATION}"
echo "Output:     ${OUTPUT_PREFIX}.*"
echo "============================================"
echo ""

echo "Starting attack with dynamic threadId generation..."
echo ""

# Generate dynamic targets with unique threadIds using jq
# This simulates real-world usage where each request has a unique threadId
jq -ncM --arg base_url "$BASE_URL" --arg stream_name "$STREAM_NAME" '
  while(true; .+1) |
  {
    method: "POST",
    url: ($base_url + "/rbac-stream/stress-thread-" + (. | tostring)),
    header: {"Content-Type": ["application/json"]},
    body: ({message: ("Stress test message " + (. | tostring)), streamName: $stream_name} | @base64)
  }
' | vegeta attack \
    -format=json \
    -rate="${RATE}" \
    -duration="${DURATION}" \
    -timeout=30s \
    -lazy \
    | tee "${OUTPUT_PREFIX}.bin" \
    | vegeta report

# Generate detailed reports
echo ""
echo "Generating reports..."

# Text report with histograms
vegeta report -type=text "${OUTPUT_PREFIX}.bin" > "${OUTPUT_PREFIX}_report.txt"
echo "  - Text report: ${OUTPUT_PREFIX}_report.txt"

# JSON report for programmatic analysis
vegeta report -type=json "${OUTPUT_PREFIX}.bin" > "${OUTPUT_PREFIX}_report.json"
echo "  - JSON report: ${OUTPUT_PREFIX}_report.json"

# HTML plot for visualization
vegeta plot -title="RBAC Stream (${STREAM_NAME}) - ${RATE}req/s x ${DURATION}" "${OUTPUT_PREFIX}.bin" > "${OUTPUT_PREFIX}_plot.html"
echo "  - HTML plot:   ${OUTPUT_PREFIX}_plot.html"

echo ""
echo "============================================"
echo "  Test Complete!"
echo "============================================"
echo ""
echo "To view the plot, open: ${OUTPUT_PREFIX}_plot.html"



