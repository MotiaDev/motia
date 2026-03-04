.PHONY: install test test-unit test-integration lint lint-fix fmt fmt-check typecheck ci clean

# Engine configuration
ENGINE_DIR      ?= ../../../engine
ENGINE_BIN      ?= ../../../target/release/iii
ENGINE_CONFIG   ?= ../../../sdk/packages/node/iii/tests/fixtures/config-test.yaml
ENGINE_PORT     ?= 49199
ENGINE_LOG      ?= /tmp/iii-engine-motia-py.log
ENGINE_PID_FILE ?= /tmp/iii-engine-motia-py.pid

# Python package directory
PKG_DIR = packages/motia

install:
	cd $(PKG_DIR) && uv sync --extra dev

test: test-unit test-integration

test-unit:
	cd $(PKG_DIR) && uv run pytest tests/ -m "not integration"

test-integration: build-engine start-engine run-integration-tests stop-engine

lint:
	cd $(PKG_DIR) && uv run ruff check src

lint-fix:
	cd $(PKG_DIR) && uv run ruff check --fix src

fmt:
	cd $(PKG_DIR) && uv run ruff format src tests

fmt-check:
	cd $(PKG_DIR) && uv run ruff format --check src tests

typecheck:
	cd $(PKG_DIR) && uv run mypy src

ci: fmt-check lint typecheck test

clean:
	rm -rf $(PKG_DIR)/.venv $(PKG_DIR)/dist $(PKG_DIR)/.mypy_cache $(PKG_DIR)/.pytest_cache

# --- Engine lifecycle (internal targets) ---

.PHONY: build-engine start-engine run-integration-tests stop-engine

build-engine:
	$(MAKE) -C $(ENGINE_DIR) build

start-engine:
	@echo "Starting III engine..."
	@$(ENGINE_BIN) --config $(ENGINE_CONFIG) > $(ENGINE_LOG) 2>&1 & echo $$! > $(ENGINE_PID_FILE)
	@echo "Waiting for III engine on port $(ENGINE_PORT)..."
	@for i in $$(seq 1 30); do \
		if nc -z 127.0.0.1 $(ENGINE_PORT) 2>/dev/null; then \
			echo "III engine is ready!"; \
			break; \
		fi; \
		if [ $$i -eq 30 ]; then \
			echo "ERROR: III engine failed to start within 60s"; \
			echo "Engine log:"; \
			cat $(ENGINE_LOG); \
			exit 1; \
		fi; \
		echo "  attempt $$i/30..."; \
		sleep 2; \
	done

run-integration-tests:
	@cd $(PKG_DIR) && uv run pytest tests/ -m "integration"; \
	EXIT_CODE=$$?; \
	$(MAKE) stop-engine; \
	exit $$EXIT_CODE

stop-engine:
	@if [ -f $(ENGINE_PID_FILE) ]; then \
		PID=$$(cat $(ENGINE_PID_FILE)); \
		if kill -0 $$PID 2>/dev/null; then \
			echo "Stopping III engine (PID $$PID)..."; \
			kill $$PID; \
		fi; \
		rm -f $(ENGINE_PID_FILE); \
	fi
