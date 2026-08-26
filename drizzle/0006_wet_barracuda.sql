ALTER TABLE `users` ADD `plan_started_at` text;--> statement-breakpoint
ALTER TABLE `users` ADD `plan_expires_at` text;--> statement-breakpoint
-- Backfill: members who already paid have a term that started at their most
-- recent settled order. Without this, everyone predating these columns looks
-- like a brand-new subscriber to the upgrade quote — an eleven-month PLUS
-- member would be credited as if they had just joined, and would upgrade to
-- PRO for almost nothing.
UPDATE `users`
SET `plan_started_at` = (
  SELECT `o`.`paid_at`
  FROM `orders` AS `o`
  WHERE `o`.`user_id` = `users`.`id`
    AND `o`.`status` = 'PAID'
    AND `o`.`paid_at` IS NOT NULL
  ORDER BY `o`.`paid_at` DESC
  LIMIT 1
)
WHERE `tier` IN ('PLUS', 'PRO') AND `plan_started_at` IS NULL;--> statement-breakpoint
-- A term runs one year. strftime rebuilds the exact ISO-8601 shape the
-- application writes with toISOString(), so both sources read back the same.
UPDATE `users`
SET `plan_expires_at` = strftime('%Y-%m-%dT%H:%M:%fZ', `plan_started_at`, '+365 days')
WHERE `plan_started_at` IS NOT NULL AND `plan_expires_at` IS NULL;
