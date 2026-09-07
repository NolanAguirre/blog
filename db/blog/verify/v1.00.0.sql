-- Verify blog:v1.00.0 on sqlite

SELECT 1 / COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'categories';
SELECT 1 / COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'site_settings';
SELECT 1 / COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'posts';
SELECT 1 / COUNT(*) FROM sqlite_master WHERE type = 'index' AND name = 'posts_published_published_on_idx';
SELECT 1 / COUNT(*) FROM sqlite_master WHERE type = 'index' AND name = 'posts_category_id_published_on_idx';
