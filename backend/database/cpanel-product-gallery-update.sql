-- Product gallery + colors/features (run once if DB already imported)
ALTER TABLE `products`
  ADD COLUMN `colors` JSON NULL AFTER `description`,
  ADD COLUMN `features` JSON NULL AFTER `colors`;

CREATE TABLE IF NOT EXISTS `product_images` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `product_id` bigint unsigned NOT NULL,
  `path` varchar(255) NOT NULL,
  `sort_order` smallint unsigned NOT NULL DEFAULT 0,
  `is_primary` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `product_images_product_id_foreign` (`product_id`),
  CONSTRAINT `product_images_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `product_images` (`product_id`, `path`, `sort_order`, `is_primary`, `created_at`, `updated_at`)
SELECT `id`, `preview_image`, 0, 1, NOW(), NOW()
FROM `products`
WHERE `preview_image` IS NOT NULL AND `preview_image` != ''
  AND NOT EXISTS (
    SELECT 1 FROM `product_images` pi WHERE pi.`product_id` = `products`.`id`
  );
