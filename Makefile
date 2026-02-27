.PHONY: test test-js test-py

test: test-js test-py

test-js:
	@cd motia-js && pnpm test

test-py:
	@cd motia-py/packages/motia && $(MAKE) test
