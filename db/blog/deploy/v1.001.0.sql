-- Deploy blog:v1.001.0 to sqlite

CREATE TABLE post_categories_new (
    post_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    PRIMARY KEY (post_id, category_id)
);

INSERT INTO post_categories_new (post_id, category_id)
SELECT id, category_id FROM posts;

CREATE TABLE posts_new (
    id INTEGER PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    excerpt TEXT NOT NULL DEFAULT '',
    body_html TEXT NOT NULL,
    published_on TEXT NOT NULL,
    published INTEGER NOT NULL DEFAULT 0 CHECK (published IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO posts_new (
    id, slug, title, excerpt, body_html, published_on, published, created_at, updated_at
)
SELECT
    id, slug, title, excerpt, body_html, published_on, published, created_at, updated_at
FROM posts;

DROP TABLE posts;

ALTER TABLE posts_new RENAME TO posts;

CREATE INDEX posts_published_published_on_idx
    ON posts (published, published_on DESC);

CREATE TABLE post_categories (
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    PRIMARY KEY (post_id, category_id)
);

CREATE INDEX post_categories_category_id_idx
    ON post_categories (category_id);

INSERT INTO post_categories (post_id, category_id)
SELECT post_id, category_id FROM post_categories_new;

DROP TABLE post_categories_new;
