# Blog Makefile
# Usage: make [target]

.POSIX:
.PHONY: start install clean deploy help \
	services.nginx.start services.nginx.stop services.nginx.reload services.nginx.status services.nginx.test \
	services.blog.start services.blog.install \
	services.auth.start services.auth.install \
	ui.blog.start ui.blog.install \
	ui.auth.start ui.auth.install \
	db.blog.help db.blog.deploy db.blog.revert db.blog.verify db.blog.reset \
	import-html render

help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  start       Start nginx, APIs, and the writer UI (http://127.0.0.1:6360/)"
	@echo "  install     Install service and UI dependencies"
	@echo "  db.blog.help    Show db/blog Makefile help"
	@echo "  db.blog.deploy  Deploy the SQLite schema"
	@echo "  db.blog.revert  Revert the last SQLite change"
	@echo "  db.blog.verify  Verify the SQLite schema"
	@echo "  db.blog.reset   Reset and redeploy the SQLite database"
	@echo "  import-html Import live HTML into SQLite"
	@echo "  render      Generate index.html, posts/, categories/, and rss.xml from SQLite"
	@echo "  deploy      Render, then publish the public root tree to gh-pages (DRY_RUN=1 to list files only)"
	@echo "  clean       Remove backup and temp files"
	@echo "  help        Show this help message"

start:
	@echo "Site:   http://127.0.0.1:6360/"
	@echo "Writer: http://127.0.0.1:6360/admin/"
	trap 'kill 0' INT TERM; \
	$(MAKE) -C services/nginx start & \
	$(MAKE) -C services/blog start & \
	$(MAKE) -C services/auth start & \
	$(MAKE) -C ui/blog start & \
	wait

install:
	$(MAKE) -C services/blog install
	$(MAKE) -C services/auth install
	$(MAKE) -C ui/blog install
	$(MAKE) -C ui/auth install

services.nginx.start:
	$(MAKE) -C services/nginx start

services.nginx.stop:
	$(MAKE) -C services/nginx stop

services.nginx.reload:
	$(MAKE) -C services/nginx reload

services.nginx.status:
	$(MAKE) -C services/nginx status

services.nginx.test:
	$(MAKE) -C services/nginx test

services.blog.start:
	$(MAKE) -C services/blog start

services.blog.install:
	$(MAKE) -C services/blog install

services.auth.start:
	$(MAKE) -C services/auth start

services.auth.install:
	$(MAKE) -C services/auth install

ui.blog.start:
	$(MAKE) -C ui/blog start

ui.blog.install:
	$(MAKE) -C ui/blog install

ui.auth.start:
	$(MAKE) -C ui/auth start

ui.auth.install:
	$(MAKE) -C ui/auth install

db.blog.help:
	$(MAKE) -C db/blog help

db.blog.deploy:
	$(MAKE) -C db/blog deploy

db.blog.revert:
	$(MAKE) -C db/blog revert

db.blog.verify:
	$(MAKE) -C db/blog verify

db.blog.reset:
	$(MAKE) -C db/blog reset

import-html: db.blog.deploy
	$(MAKE) -C services/blog import-html

render:
	$(MAKE) -C services/blog render

deploy: render
	DRY_RUN="$(DRY_RUN)" ./scripts/deploy-gh-pages

# Remove backup and temp files
clean:
	@find . -name "*.bak" -delete
	@find . -name "*~" -delete
	@find . -name ".DS_Store" -delete
	@echo "Cleaned up backup and temp files"
