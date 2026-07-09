.PHONY: pg gp

pg: gp

gp:
	git add .
	git commit -m "Auto commit" || echo "No changes to commit"
	git push
