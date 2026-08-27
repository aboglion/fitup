.PHONY: pg gp test

test:
	python3 tests/check.py
	node --test tests/*.test.js

pg: gp

gp:
	git add .
	git commit -m "Auto commit" || echo "No changes to commit"
	git push

