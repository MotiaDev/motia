# Shared helpers for the chapter assertions.
fails=0

check() {
  local label=$1 expected=$2 actual=$3
  if [[ "$actual" == *"$expected"* ]]; then
    echo "  ok   $label"
  else
    echo "  FAIL $label: expected '$expected' in '$actual'" >&2
    fails=1
  fi
}

# Project functions live in the project namespace (`default` unless the run
# moved it); -n reaches them there. engine::* builtins always answer in default.
t() {
  local ns="${NAMESPACE:-default}"
  [[ "$1" == engine::* ]] && ns=default
  "${III_BIN:-iii}" trigger -n "$ns" --engine "${III_URL:-ws://127.0.0.1:49134}" "$@" 2>&1
}

finish() { return $fails; }
