.PHONY: push

MSG ?=

push:
	git add .
	@if [ -z "$(MSG)" ]; then \
		read -p "Enter commit message: " msg; \
		if [ -z "$$msg" ]; then msg="Update"; fi; \
		git commit -m "$$msg"; \
	else \
		git commit -m "$(MSG)"; \
	fi
	git push
