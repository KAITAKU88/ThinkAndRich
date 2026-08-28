-- Credit-pricing model: replace access_level / membership tier with
-- per-post credit_cost, paid+gift wallets, permanent unlocks, credit
-- packages on orders, and DB-backed market prices.
--> statement-breakpoint
ALTER TABLE `posts` ADD `credit_cost` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE `posts` SET `credit_cost` = CASE `access_level`
  WHEN 'OPEN' THEN 0
  WHEN 'FREE' THEN 1
  WHEN 'MEMBER_PLUS' THEN 3
  WHEN 'MEMBER_PRO' THEN 5
  ELSE 1
END;--> statement-breakpoint
ALTER TABLE `posts` DROP COLUMN `access_level`;--> statement-breakpoint
ALTER TABLE `users` ADD `paid_credit_balance` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `paid_credit_expires_at` text;--> statement-breakpoint
ALTER TABLE `users` ADD `gift_credit_balance` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `gift_credit_date` text;--> statement-breakpoint
ALTER TABLE `users` ADD `gift_granted_this_month` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `gift_month` text;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `tier`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `daily_reads_date`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `daily_reads_count`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `plan_started_at`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `plan_expires_at`;--> statement-breakpoint
ALTER TABLE `orders` ADD `package_id` text DEFAULT 'pack_1' NOT NULL;--> statement-breakpoint
UPDATE `orders` SET `package_id` = CASE `tier`
  WHEN 'PRO' THEN 'pack_3'
  WHEN 'PLUS' THEN 'pack_2'
  ELSE 'pack_1'
END;--> statement-breakpoint
ALTER TABLE `orders` DROP COLUMN `tier`;--> statement-breakpoint
CREATE TABLE `user_unlocks` (
	`user_id` text NOT NULL,
	`post_id` text NOT NULL,
	`unlocked_at` text NOT NULL,
	`credits_spent` integer NOT NULL,
	`gift_spent` integer DEFAULT 0 NOT NULL,
	`paid_spent` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`user_id`, `post_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
CREATE INDEX `user_unlocks_user_id_idx` ON `user_unlocks` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_unlocks_unlocked_at_idx` ON `user_unlocks` (`unlocked_at`);--> statement-breakpoint
CREATE TABLE `market_pricing` (
	`country_code` text NOT NULL,
	`package_id` text NOT NULL,
	`fx_rate_per_vnd` text NOT NULL,
	`ppp_multiplier` text NOT NULL,
	`computed_price` integer NOT NULL,
	`currency` text NOT NULL,
	`updated_at` text NOT NULL,
	`updated_by` text NOT NULL,
	`source` text NOT NULL,
	PRIMARY KEY(`country_code`, `package_id`)
);--> statement-breakpoint
CREATE TABLE `pricing_refresh_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`mode` text DEFAULT 'MANUAL' NOT NULL,
	`interval_days` integer DEFAULT 90 NOT NULL,
	`scheduled_hour_utc` integer DEFAULT 3 NOT NULL,
	`last_run_at` text,
	`next_run_at` text
);--> statement-breakpoint
CREATE TABLE `pricing_refresh_log` (
	`id` text PRIMARY KEY NOT NULL,
	`triggered_by` text NOT NULL,
	`started_at` text NOT NULL,
	`finished_at` text,
	`status` text NOT NULL,
	`diff` text,
	`error` text
);--> statement-breakpoint
CREATE TABLE `maintenance_mode` (
	`id` text PRIMARY KEY NOT NULL,
	`enabled` integer DEFAULT false NOT NULL,
	`enabled_at` text,
	`enabled_by` text,
	`reason` text,
	`message_vi` text,
	`message_en` text
);--> statement-breakpoint
INSERT INTO `pricing_refresh_settings` (`id`, `mode`, `interval_days`, `scheduled_hour_utc`) VALUES ('default', 'MANUAL', 90, 3);--> statement-breakpoint
INSERT INTO `maintenance_mode` (`id`, `enabled`) VALUES ('current', 0);--> statement-breakpoint
INSERT INTO `market_pricing` (`country_code`, `package_id`, `fx_rate_per_vnd`, `ppp_multiplier`, `computed_price`, `currency`, `updated_at`, `updated_by`, `source`) VALUES
  ('VN', 'pack_1', '1', '1', 150000, 'VND', '2026-08-28T00:00:00.000Z', 'seed', 'manual'),
  ('VN', 'pack_2', '1', '1', 300000, 'VND', '2026-08-28T00:00:00.000Z', 'seed', 'manual'),
  ('VN', 'pack_3', '1', '1', 500000, 'VND', '2026-08-28T00:00:00.000Z', 'seed', 'manual'),
  ('US', 'pack_1', '25000', '4.1', 25, 'USD', '2026-08-28T00:00:00.000Z', 'seed', 'manual'),
  ('US', 'pack_2', '25000', '4.1', 49, 'USD', '2026-08-28T00:00:00.000Z', 'seed', 'manual'),
  ('US', 'pack_3', '25000', '4.1', 79, 'USD', '2026-08-28T00:00:00.000Z', 'seed', 'manual'),
  ('EU', 'pack_1', '27200', '3.55', 19, 'EUR', '2026-08-28T00:00:00.000Z', 'seed', 'manual'),
  ('EU', 'pack_2', '27200', '3.55', 39, 'EUR', '2026-08-28T00:00:00.000Z', 'seed', 'manual'),
  ('EU', 'pack_3', '27200', '3.55', 65, 'EUR', '2026-08-28T00:00:00.000Z', 'seed', 'manual'),
  ('JP', 'pack_1', '167', '2.78', 2480, 'JPY', '2026-08-28T00:00:00.000Z', 'seed', 'manual'),
  ('JP', 'pack_2', '167', '2.78', 4980, 'JPY', '2026-08-28T00:00:00.000Z', 'seed', 'manual'),
  ('JP', 'pack_3', '167', '2.78', 8480, 'JPY', '2026-08-28T00:00:00.000Z', 'seed', 'manual'),
  ('KR', 'pack_1', '18.5', '2.79', 23000, 'KRW', '2026-08-28T00:00:00.000Z', 'seed', 'manual'),
  ('KR', 'pack_2', '18.5', '2.79', 45000, 'KRW', '2026-08-28T00:00:00.000Z', 'seed', 'manual'),
  ('KR', 'pack_3', '18.5', '2.79', 75000, 'KRW', '2026-08-28T00:00:00.000Z', 'seed', 'manual'),
  ('TW', 'pack_1', '794', '2.38', 449, 'TWD', '2026-08-28T00:00:00.000Z', 'seed', 'manual'),
  ('TW', 'pack_2', '794', '2.38', 899, 'TWD', '2026-08-28T00:00:00.000Z', 'seed', 'manual'),
  ('TW', 'pack_3', '794', '2.38', 1499, 'TWD', '2026-08-28T00:00:00.000Z', 'seed', 'manual'),
  ('CN', 'pack_1', '3472', '1.73', 75, 'CNY', '2026-08-28T00:00:00.000Z', 'seed', 'manual'),
  ('CN', 'pack_2', '3472', '1.73', 149, 'CNY', '2026-08-28T00:00:00.000Z', 'seed', 'manual'),
  ('CN', 'pack_3', '3472', '1.73', 249, 'CNY', '2026-08-28T00:00:00.000Z', 'seed', 'manual'),
  ('DEFAULT', 'pack_1', '25000', '3.26', 19, 'USD', '2026-08-28T00:00:00.000Z', 'seed', 'manual'),
  ('DEFAULT', 'pack_2', '25000', '3.26', 39, 'USD', '2026-08-28T00:00:00.000Z', 'seed', 'manual'),
  ('DEFAULT', 'pack_3', '25000', '3.26', 65, 'USD', '2026-08-28T00:00:00.000Z', 'seed', 'manual');
