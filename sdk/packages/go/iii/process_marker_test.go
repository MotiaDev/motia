package iii

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"testing"
)

func TestAnnounceProcessNamesThisProcessUntilRemoved(t *testing.T) {
	dir := t.TempDir()
	file := filepath.Join(dir, fmt.Sprintf("worker-%d.json", os.Getpid()))

	remove := announceProcess("ws://127.0.0.1:49134", "orders", dir)
	data, err := os.ReadFile(file)
	if err != nil {
		t.Fatalf("marker not written: %v", err)
	}
	var marker map[string]any
	if err := json.Unmarshal(data, &marker); err != nil {
		t.Fatal(err)
	}
	if marker["pid"] != float64(os.Getpid()) || marker["name"] != "orders" ||
		marker["url"] != "ws://127.0.0.1:49134" || marker["sdk"] != "go" {
		t.Fatalf("unexpected marker: %v", marker)
	}

	remove()
	if _, err := os.Stat(file); !os.IsNotExist(err) {
		t.Fatalf("marker still present after remove: %v", err)
	}
}

func TestAnnounceProcessIgnoresAnUnwritableDirectory(t *testing.T) {
	blocker := filepath.Join(t.TempDir(), "file")
	if err := os.WriteFile(blocker, nil, 0o644); err != nil {
		t.Fatal(err)
	}
	announceProcess("ws://x", "y", filepath.Join(blocker, "run"))()
}
