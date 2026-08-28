-- Promotions + order discount tracking + admin gateway
CREATE TABLE `promotions` (
  `id` text PRIMARY KEY NOT NULL,
  `code` text NOT NULL,
  `name` text NOT NULL,
  `kind` text NOT NULL,
  `discount_percent` integer,
  `discount_amount_vnd` integer,
  `package_ids` text,
  `max_uses` integer,
  `used_count` integer DEFAULT 0 NOT NULL,
  `starts_at` text,
  `ends_at` text,
  `active` integer DEFAULT 1 NOT NULL,
  `created_at` text NOT NULL
);
CREATE UNIQUE INDEX `promotions_code_idx` ON `promotions` (`code`);

CREATE TABLE `promotion_redemptions` (
  `id` text PRIMARY KEY NOT NULL,
  `promotion_id` text NOT NULL,
  `user_id` text NOT NULL,
  `order_id` text,
  `redeemed_at` text NOT NULL,
  FOREIGN KEY (`promotion_id`) REFERENCES `promotions`(`id`) ON DELETE cascade,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE set null
);
CREATE INDEX `promotion_redemptions_promotion_idx` ON `promotion_redemptions` (`promotion_id`);
CREATE INDEX `promotion_redemptions_user_idx` ON `promotion_redemptions` (`user_id`);

ALTER TABLE `orders` ADD `promotion_id` text REFERENCES promotions(id);
ALTER TABLE `orders` ADD `discount_amount` integer DEFAULT 0 NOT NULL;
