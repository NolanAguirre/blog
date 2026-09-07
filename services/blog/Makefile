.PHONY: start install import-html help

help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  start        Start the service"
	@echo "  install      Install dependencies"
	@echo "  import-html  Import live HTML into SQLite"
	@echo "  help         Show this help message"

start:
	../../scripts/run-with-env-dir ./env-dir npm start

install:
	npm install

import-html:
	FORCE="$(FORCE)" ../../scripts/run-with-env-dir ./env-dir node scripts/import-html.js
