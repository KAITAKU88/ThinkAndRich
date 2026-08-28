CREATE TABLE `auth_otps` (
	`email` text NOT NULL,
	`code` text NOT NULL,
	`expires_at` text NOT NULL,
	PRIMARY KEY(`email`, `code`)
);
--> statement-breakpoint
CREATE INDEX `auth_otps_expires_idx` ON `auth_otps` (`expires_at`);
