# Nolan's Blog

A static HTML blog with shared styling across all pages.

## Structure

```
blog/
├── css/
│   └── style.css          # Shared stylesheet (ALL pages use this)
├── categories/
│   ├── development.html
│   ├── management.html
│   ├── fishing.html
│   ├── gaming.html
│   └── misc.html
├── posts/
│   ├── _template.html     # Copy this to create new posts
│   └── *.html             # Individual blog posts
├── index.html             # Homepage with post listing
└── README.md
```

## Creating a New Post

1. Copy `posts/_template.html` to `posts/your-post-name.html`
2. Replace the placeholder values:
   - `POST_TITLE` → Your post title
   - `POST_EXCERPT` → Brief description for meta tag
   - `CATEGORY_SLUG` → One of: `development`, `management`, `fishing`, `gaming`, `misc`
   - `CATEGORY_NAME` → Display name: `Development`, `Management`, `Fishing`, `Gaming`, `Misc`
   - `YYYY-MM-DD` → ISO date format
   - `MONTH DD, YYYY` → Display date format
3. Write your content inside `<div class="post-content">`
4. Add a link to the post on:
   - `index.html` (in the posts list)
   - The appropriate category page in `categories/`

## Adding a New Category

1. Create a new file in `categories/` (copy an existing one as template)
2. Update the navigation in ALL existing HTML files:
   - `index.html`
   - All files in `categories/`
   - All files in `posts/`
   - `posts/_template.html`

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

## Serving Locally

Open `index.html` directly in a browser, or use a local server:

```sh
python3 -m http.server 8000
# Then visit http://localhost:8000
```

## License

Personal blog content. All rights reserved.
