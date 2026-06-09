.PHONY: push

MSG ?=

push:
	git add .
	@if ! git diff --cached --quiet; then \
		if [ -z "$(MSG)" ]; then \
			read -p "Enter commit message: " msg; \
			if [ -z "$$msg" ]; then msg="Update"; fi; \
			git commit -m "$$msg"; \
		else \
			git commit -m "$(MSG)"; \
		fi; \
	else \
		echo "No changes to commit"; \
	fi
	git push
