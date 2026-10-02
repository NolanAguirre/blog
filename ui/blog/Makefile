.PHONY: start dev install help

help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  start    Start the Vite dev server"
	@echo "  dev      Start the Vite dev server"
	@echo "  install  Install dependencies"
	@echo "  help     Show this help message"

start:
	../../scripts/multi-envdir ./env-dir npm run dev

dev:
	../../scripts/multi-envdir ./env-dir npm run dev

install:
	npm install
