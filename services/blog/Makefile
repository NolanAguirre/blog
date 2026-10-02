.PHONY: start install import-html render help

help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  start        Start the service"
	@echo "  install      Install dependencies"
	@echo "  import-html  Import live HTML into SQLite"
	@echo "  render       Write the public site from SQLite"
	@echo "  help         Show this help message"

start:
	../../scripts/multi-envdir ./env-dir npm start

install:
	npm install

import-html:
	FORCE="$(FORCE)" ../../scripts/multi-envdir ./env-dir node scripts/import-html.js

render:
	../../scripts/multi-envdir ./env-dir node scripts/render.js
