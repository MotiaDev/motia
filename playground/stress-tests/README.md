# Stress Tests

HTTP load testing for Motia endpoints using [Vegeta](https://github.com/tsenart/vegeta).

## Prerequisites

### Install Vegeta

**macOS (Homebrew):**
```bash
brew install vegeta
```

**Go (any platform):**
```bash
go install github.com/tsenart/vegeta/v12@latest
```

### Install jq (required for RBAC Stream tests)

**macOS (Homebrew):**
```bash
brew install jq
```

**Linux (apt):**
```bash
apt-get install jq
```

## Endpoints Tested

### 1. Parallel Merge (`POST /api/parallel-merge`)

Triggers a parallel workflow that runs 3 steps concurrently (stepA, stepB, stepC) and merges their results.

**Request Body:**
```json
{"message": "Stress test parallel merge"}
```

### 2. RBAC Stream (`POST /rbac-stream/:threadId`)

Triggers an RBAC-protected stream that writes messages. Supports both TypeScript and Python stream handlers.

**Request Body:**
```json
{"message": "Test message", "streamName": "rbac_message"}
```

**Stream Options:**
- `rbac_message` - TypeScript stream handler
- `rbac_message_python` - Python stream handler

## Usage

### Start the Motia Server

Before running stress tests, start the Motia dev server:

```bash
cd playground
pnpm dev
```

### Run Individual Tests

**Parallel Merge:**
```bash
./scripts/run-parallel-merge.sh [rate] [duration] [base_url]

# Examples:
./scripts/run-parallel-merge.sh              # 50 req/s for 30s
./scripts/run-parallel-merge.sh 100 60s      # 100 req/s for 60s
./scripts/run-parallel-merge.sh 200 2m http://localhost:4000
```

**RBAC Stream:**
```bash
./scripts/run-rbac-stream.sh [rate] [duration] [base_url] [stream_name]

# Examples:
./scripts/run-rbac-stream.sh                 # 50 req/s for 30s with TypeScript stream
./scripts/run-rbac-stream.sh 100 60s         # 100 req/s for 60s
./scripts/run-rbac-stream.sh 50 30s http://localhost:3000 rbac_message_python
```

### Run All Tests

```bash
./scripts/run-all.sh [rate] [duration] [base_url]

# Examples:
./scripts/run-all.sh                         # Run all with defaults
./scripts/run-all.sh 100 60s                 # 100 req/s for 60s each
```

## Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| `rate` | 50 | Requests per second |
| `duration` | 30s | Test duration (e.g., 30s, 1m, 5m) |
| `base_url` | http://localhost:3000 | Server base URL |
| `stream_name` | rbac_message | Stream name for RBAC tests |

## Output

Each test generates the following files in `results/`:

| File | Description |
|------|-------------|
| `*_TIMESTAMP.bin` | Raw Vegeta results (binary) |
| `*_TIMESTAMP_report.txt` | Human-readable text report |
| `*_TIMESTAMP_report.json` | JSON report for programmatic analysis |
| `*_TIMESTAMP_plot.html` | Interactive HTML latency plot |

### Sample Text Report

```
Requests      [total, rate, throughput]  1500, 50.03, 49.97
Duration      [total, attack, wait]      30.019s, 29.98s, 39.12ms
Latencies     [min, mean, 50, 90, 95, 99, max]  12.34ms, 45.67ms, 42.11ms, 78.90ms, 95.43ms, 123.45ms, 234.56ms
Bytes In      [total, mean]              45000, 30.00
Bytes Out     [total, mean]              75000, 50.00
Success       [ratio]                    100.00%
Status Codes  [code:count]               200:1500
```

### HTML Plot

Open the generated `*_plot.html` file in a browser to view an interactive latency plot:
- X-axis: Elapsed time (seconds)
- Y-axis: Request latency (milliseconds)
- Click and drag to zoom, double-click to reset

## Advanced Usage

### Custom Targets

You can modify the target files in `targets/` to customize request bodies:
- `targets/parallel-merge.txt` and `targets/parallel-merge-body.json`
- `targets/rbac-stream.txt` and `targets/rbac-stream-body.json`

### Distributed Testing

For higher load, run Vegeta on multiple machines:

```bash
# On each machine
./scripts/run-parallel-merge.sh 100 60s http://target-server:3000
```

Then combine results:
```bash
vegeta report machine1.bin machine2.bin machine3.bin
```

### Real-time Monitoring

Use Vegeta with `jaggr` and `jplot` for real-time visualization:

```bash
echo "POST http://localhost:3000/api/parallel-merge" | \
  vegeta attack -body='{"message":"test"}' -rate=50 -duration=5m | \
  vegeta encode | \
  jaggr @count=rps hist[100,200,300,400,500]:code p50,p95,p99:latency | \
  jplot rps+code.hist.200 latency.p95+latency.p50
```

## Troubleshooting

### "Too many open files" error

Increase file descriptor limits:
```bash
ulimit -n 10000
```

### Connection refused

Ensure the Motia server is running on the expected port:
```bash
curl http://localhost:3000/__motia
```

### Slow response times

Check if Redis is running and properly connected:
```bash
redis-cli ping
```



