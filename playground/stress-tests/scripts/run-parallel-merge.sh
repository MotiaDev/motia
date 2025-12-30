#!/bin/bash

# Stress test for the Parallel Merge endpoint
# Usage: ./run-parallel-merge.sh [rate] [duration] [base_url]
#
# Arguments:
#   rate      - Requests per second (default: 50)
#   duration  - Test duration (default: 30s)
#   base_url  - Base URL of the server (default: http://localhost:3000)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Default configuration
RATE="${1:-50}"
DURATION="${2:-30s}"
BASE_URL="${3:-http://localhost:3000}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RESULTS_DIR="$ROOT_DIR/results"
OUTPUT_PREFIX="$RESULTS_DIR/parallel-merge_${TIMESTAMP}"

# Check if vegeta is installed
if ! command -v vegeta &> /dev/null; then
    echo "Error: vegeta is not installed."
    echo "Install it with: brew install vegeta (macOS) or go install github.com/tsenart/vegeta/v12@latest"
    exit 1
fi

# Ensure results directory exists
mkdir -p "$RESULTS_DIR"

echo "============================================"
echo "  Parallel Merge Stress Test"
echo "============================================"
echo "Target:     POST ${BASE_URL}/api/parallel-merge"
echo "Rate:       ${RATE} req/s"
echo "Duration:   ${DURATION}"
echo "Output:     ${OUTPUT_PREFIX}.*"
echo "============================================"
echo ""

# Create request body
BODY='{"message": "Stress test parallel merge"}'

echo "Starting attack..."
echo ""

# Run the attack and save results
echo "POST ${BASE_URL}/api/parallel-merge" | vegeta attack \
    -body=<(echo "$BODY") \
    -header="Content-Type: application/json" \
    -rate="${RATE}" \
    -duration="${DURATION}" \
    -timeout=30s \
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
vegeta plot -title="Parallel Merge - ${RATE}req/s x ${DURATION}" "${OUTPUT_PREFIX}.bin" > "${OUTPUT_PREFIX}_plot.html"
echo "  - HTML plot:   ${OUTPUT_PREFIX}_plot.html"

echo ""
echo "============================================"
echo "  Test Complete!"
echo "============================================"
echo ""
echo "To view the plot, open: ${OUTPUT_PREFIX}_plot.html"

