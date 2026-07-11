.PHONY: pg gp

pg: gp

gp:
	python3 generate_program.py
	git add .
	git commit -m "Auto commit" || echo "No changes to commit"
	git push
