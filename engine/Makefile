.PHONY: build build-debug test lint fmt fmt-check ci clean watch-debug

ENGINE_BIN ?= ../target/release/iii

build:
	cargo build -p iii --release

build-debug:
	cargo build -p iii

test:
	cargo test -p iii --all-features

lint:
	cargo clippy -p iii --all-targets --all-features -- -D warnings

fmt:
	cargo fmt --all

fmt-check:
	cargo fmt --all -- --check

ci: fmt-check lint test

clean:
	cargo clean

watch-debug:
	cargo watch -w Cargo.toml -w config.yaml -w src -s "RUST_LOG=debug cargo run "
