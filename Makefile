# Blog Makefile
# Usage: make [target]

.POSIX:
.PHONY: start clean new-post deploy help

# Default port for local server
PORT ?= 8000

# Default target
help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  start      Start local development server on port $(PORT)"
	@echo "  new-post   Create a new post (usage: make new-post NAME=my-post-title)"
	@echo "  deploy     Deploy to GitHub Pages (gh-pages branch)"
	@echo "  clean      Remove backup and temp files"
	@echo "  help       Show this help message"

# Start local development server
start:
	@echo "Starting server at http://localhost:9417"
	@python3 -m http.server 9417

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

# Deploy to GitHub Pages
deploy:
	@if [ ! -d .git ]; then \
		echo "Error: not a git repository"; \
		exit 1; \
	fi
	@touch .nojekyll
	@git add -A
	@git commit -m "Deploy to gh-pages" || true
	@git push origin HEAD:gh-pages --force
	@echo "Deployed to gh-pages branch"
	@echo "Configure GitHub Pages: Settings > Pages > Source: gh-pages branch"

# Remove backup and temp files
clean:
	@find . -name "*.bak" -delete
	@find . -name "*~" -delete
	@find . -name ".DS_Store" -delete
	@echo "Cleaned up backup and temp files"

