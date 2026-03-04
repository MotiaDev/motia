.PHONY: install build test test-unit test-integration lint lint-ci lint-fix fmt fmt-check typecheck ci clean

# Engine configuration
ENGINE_DIR      ?= ../../../engine
ENGINE_BIN      ?= ../../../target/release/iii
ENGINE_CONFIG   ?= ../../../sdk/packages/node/iii/tests/fixtures/config-test.yaml
ENGINE_PORT     ?= 49199
ENGINE_LOG      ?= /tmp/iii-engine-motia-js.log
ENGINE_PID_FILE ?= /tmp/iii-engine-motia-js.pid

install:
	pnpm install

build:
	pnpm --filter motia build

test: test-unit test-integration

test-unit:
	pnpm --filter motia test:unit

test-integration: build-engine start-engine run-integration-tests stop-engine

lint:
	pnpm lint

lint-ci:
	pnpm lint:ci

lint-fix:
	pnpm lint:fix

fmt:
	pnpm format

fmt-check:
	pnpm format:check

typecheck:
	cd packages/motia && npx tsc --noEmit

ci: fmt-check lint typecheck test

clean:
	rm -rf node_modules packages/*/dist packages/*/node_modules

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
	@pnpm --filter motia test:integration; \
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
