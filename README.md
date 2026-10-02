# Nolan's Blog

A local HTML writer that renders a static site into the repo root. GitHub Pages serves the generated tree at https://nolanaguirre.github.io/blog/.

## Public tree at `./`

`index.html` is the Pages entry. Also published:

- `posts/*.html`
- `categories/*.html`
- `css/style.css`
- `rss.xml`
- `.nojekyll`

Relative links are required under `/blog/`. Writer and APIs never run on Pages.

Root `*.md` files are notes, not the publishing format.

## Local authoring

```sh
make install
make start
```

- Site: http://127.0.0.1:9090/
- Writer: http://127.0.0.1:9090/admin/

Use the writer for posts, categories, site settings, and Generate site.

## Render / deploy

```sh
make render
make deploy DRY_RUN=1
make deploy
```

`make render` writes `./` from SQLite. `make deploy` renders, then force-pushes only the public allowlist to `gh-pages`. `make deploy DRY_RUN=1` lists files and does not push.

## Styling Rules

**IMPORTANT: All styling is shared. Do not create page-specific CSS.**

- All pages link to `css/style.css`
- To change colors, fonts, or spacing, edit the CSS variables in `:root`
- Use existing CSS classes; add new ones to `style.css` if needed
- See the CSS file for available utility classes

### Available CSS Variables

```css
--color-bg          /* Page background */
--color-bg-alt      /* Alternate background (header/footer) */
--color-text        /* Main text color */
--color-text-muted  /* Secondary text */
--color-accent      /* Accent color (buttons, highlights) */
--color-link        /* Link color */
--color-border      /* Border color */
```

### Common Classes

- `.content` — Centers and constrains width for readability
- `.post-header` — Centered header with title and meta
- `.post-content` — Article body styling
- `.post-category` — Category badge
- `.posts-list` — List of post previews
- `.text-center`, `.text-muted` — Utility classes

## License

Personal blog content. All rights reserved.
