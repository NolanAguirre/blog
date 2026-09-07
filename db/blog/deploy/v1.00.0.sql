-- Deploy blog:v1.00.0 to sqlite

CREATE TABLE categories (
    id INTEGER PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL
);

CREATE TABLE site_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    title TEXT NOT NULL,
    tagline TEXT NOT NULL,
    welcome TEXT NOT NULL,
    github_url TEXT NOT NULL,
    footer_year INTEGER NOT NULL
);

CREATE TABLE posts (
    id INTEGER PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    excerpt TEXT NOT NULL DEFAULT '',
    body_html TEXT NOT NULL,
    published_on TEXT NOT NULL,
    published INTEGER NOT NULL DEFAULT 0 CHECK (published IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX posts_published_published_on_idx
    ON posts (published, published_on DESC);

CREATE INDEX posts_category_id_published_on_idx
    ON posts (category_id, published_on DESC);
