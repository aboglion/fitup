.PHONY: pg gp test

test:
	python3 tests/check.py
	python3 tests/check_mismatches.py
	node --test tests/*.test.js
	node tests/deep_audit.js
	node tests/full_system_audit.js
	node tests/microscopic_audit.js
	node tests/ultra_deep_audit.js

pg: gp

gp:
	git add .
	git commit -m "Auto commit" || echo "No changes to commit"
	git push

