.PHONY: test lint fmt fmt-check ci clean \
        build-engine test-engine lint-engine fmt-engine fmt-check-engine \
        test-motia-js lint-motia-js fmt-motia-js fmt-check-motia-js \
        test-motia-py lint-motia-py fmt-motia-py fmt-check-motia-py

ENGINE_DIR    = engine
MOTIA_JS_DIR  = frameworks/motia/motia-js
MOTIA_PY_DIR  = frameworks/motia/motia-py

# --- Aggregate targets ---

test: test-engine test-motia-js test-motia-py

lint: lint-engine lint-motia-js lint-motia-py

fmt: fmt-engine fmt-motia-js fmt-motia-py

fmt-check: fmt-check-engine fmt-check-motia-js fmt-check-motia-py

ci:
	$(MAKE) -C $(ENGINE_DIR) ci
	$(MAKE) -C $(MOTIA_JS_DIR) ci
	$(MAKE) -C $(MOTIA_PY_DIR) ci

clean:
	$(MAKE) -C $(ENGINE_DIR) clean
	$(MAKE) -C $(MOTIA_JS_DIR) clean
	$(MAKE) -C $(MOTIA_PY_DIR) clean

# --- Engine ---

build-engine:
	$(MAKE) -C $(ENGINE_DIR) build

test-engine:
	$(MAKE) -C $(ENGINE_DIR) test

lint-engine:
	$(MAKE) -C $(ENGINE_DIR) lint

fmt-engine:
	$(MAKE) -C $(ENGINE_DIR) fmt

fmt-check-engine:
	$(MAKE) -C $(ENGINE_DIR) fmt-check

# --- Motia JS ---

test-motia-js:
	$(MAKE) -C $(MOTIA_JS_DIR) test

lint-motia-js:
	$(MAKE) -C $(MOTIA_JS_DIR) lint

fmt-motia-js:
	$(MAKE) -C $(MOTIA_JS_DIR) fmt

fmt-check-motia-js:
	$(MAKE) -C $(MOTIA_JS_DIR) fmt-check

# --- Motia Python ---

test-motia-py:
	$(MAKE) -C $(MOTIA_PY_DIR) test

lint-motia-py:
	$(MAKE) -C $(MOTIA_PY_DIR) lint

fmt-motia-py:
	$(MAKE) -C $(MOTIA_PY_DIR) fmt

fmt-check-motia-py:
	$(MAKE) -C $(MOTIA_PY_DIR) fmt-check
