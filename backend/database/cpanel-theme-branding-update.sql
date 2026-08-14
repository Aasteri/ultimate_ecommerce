-- Optional: seed default branding/theme keys if missing (safe to re-run)
INSERT INTO settings (`key`, `value`, created_at, updated_at)
SELECT 'hero_badge', 'Marketplace for tailors', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE `key` = 'hero_badge');

INSERT INTO settings (`key`, `value`, created_at, updated_at)
SELECT 'hero_title', 'Everything a tailor needs, in one market', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE `key` = 'hero_title');

INSERT INTO settings (`key`, `value`, created_at, updated_at)
SELECT 'hero_subtitle', 'Shop fabrics, tools, threads, machines, and digital patterns from trusted vendors. Download files instantly or get physical supplies delivered.', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE `key` = 'hero_subtitle');

INSERT INTO settings (`key`, `value`, created_at, updated_at)
SELECT 'hero_card_label', 'Curated supplies', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE `key` = 'hero_card_label');

INSERT INTO settings (`key`, `value`, created_at, updated_at)
SELECT 'theme_primary', 'forest', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE `key` = 'theme_primary');

INSERT INTO settings (`key`, `value`, created_at, updated_at)
SELECT 'theme_secondary', 'sand', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE `key` = 'theme_secondary');

INSERT INTO settings (`key`, `value`, created_at, updated_at)
SELECT 'theme_accent', 'camel', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE `key` = 'theme_accent');

-- Full token map is created/updated from Admin → Colors & branding.
-- Optional empty placeholder so the key exists:
INSERT INTO settings (`key`, `value`, created_at, updated_at)
SELECT 'theme_tokens', '{}', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE `key` = 'theme_tokens');

INSERT INTO settings (`key`, `value`, created_at, updated_at)
SELECT 'layout_id', 'classic', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE `key` = 'layout_id');

INSERT INTO settings (`key`, `value`, created_at, updated_at)
SELECT 'layout_bg_overlay', '0', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE `key` = 'layout_bg_overlay');

INSERT INTO settings (`key`, `value`, created_at, updated_at)
SELECT 'layout_bg_images', '[]', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE `key` = 'layout_bg_images');
