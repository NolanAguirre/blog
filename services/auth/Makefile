.PHONY: start install help

help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  start    Start the service"
	@echo "  install  Install dependencies"
	@echo "  help     Show this help message"

start:
	../../scripts/run-with-env-dir ./env-dir npm start

install:
	npm install
