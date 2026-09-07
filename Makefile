# Blog Makefile
# Usage: make [target]

.POSIX:
.PHONY: start install clean new-post deploy help \
	services.nginx.start services.nginx.stop services.nginx.reload services.nginx.status services.nginx.test \
	services.blog.start services.blog.install \
	services.auth.start services.auth.install \
	ui.blog.start ui.blog.install \
	ui.auth.start ui.auth.install

help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  start      Start nginx, APIs, and the writer UI (http://127.0.0.1:9417/)"
	@echo "  install    Install service and UI dependencies"
	@echo "  new-post   Create a new post (usage: make new-post NAME=my-post-title)"
	@echo "  deploy     Guarded until filtered publish is implemented"
	@echo "  clean      Remove backup and temp files"
	@echo "  help       Show this help message"

start:
	@echo "Site:   http://127.0.0.1:9417/"
	@echo "Writer: http://127.0.0.1:9417/admin/"
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

# Create a new post from template
# Usage: make new-post NAME=my-post-title
new-post:
	@if [ -z "$(NAME)" ]; then \
		echo "Error: NAME is required"; \
		echo "Usage: make new-post NAME=my-post-title"; \
		exit 1; \
	fi
	@if [ -f "posts/$(NAME).html" ]; then \
		echo "Error: posts/$(NAME).html already exists"; \
		exit 1; \
	fi
	@cp posts/_template.html "posts/$(NAME).html"
	@echo "Created posts/$(NAME).html"
	@echo "Next steps:"
	@echo "  1. Edit posts/$(NAME).html"
	@echo "  2. Replace POST_TITLE, POST_EXCERPT, CATEGORY_*, and date placeholders"
	@echo "  3. Add link to index.html and appropriate category page"

# Filtered publish is phase 6. Do not force-push HEAD to gh-pages.
deploy:
	@echo "Error: filtered publish is not implemented yet"
	@echo "Do not force-push HEAD to gh-pages; that would publish services/ and ui/"
	@exit 1

# Remove backup and temp files
clean:
	@find . -name "*.bak" -delete
	@find . -name "*~" -delete
	@find . -name ".DS_Store" -delete
	@echo "Cleaned up backup and temp files"
