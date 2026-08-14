-- Optional phpMyAdmin SQL if you cannot run `php artisan migrate` on cPanel.
-- Adds unsubscribe tokens and campaign history for in-platform marketing.

ALTER TABLE newsletter_subscribers
  ADD COLUMN unsubscribe_token VARCHAR(64) NULL UNIQUE AFTER is_active;

UPDATE newsletter_subscribers
SET unsubscribe_token = CONCAT(
  SUBSTRING(MD5(RAND()), 1, 16),
  SUBSTRING(MD5(CONCAT(id, email, RAND())), 1, 32)
)
WHERE unsubscribe_token IS NULL;

CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  audience VARCHAR(40) NOT NULL,
  recipients_count INT UNSIGNED NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'sent',
  error_message TEXT NULL,
  sent_at TIMESTAMP NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  CONSTRAINT marketing_campaigns_user_id_foreign
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
