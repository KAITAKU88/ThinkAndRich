CREATE TABLE `mcp_auth_codes` (
	`code_hash` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`redirect_uri` text NOT NULL,
	`code_challenge` text NOT NULL,
	`code_challenge_method` text NOT NULL,
	`scope` text NOT NULL,
	`user_id` text NOT NULL,
	`user_email` text NOT NULL,
	`resource` text,
	`created_at` text NOT NULL,
	`expires_at` text NOT NULL,
	`used_at` text
);
--> statement-breakpoint
CREATE INDEX `mcp_auth_codes_expires_idx` ON `mcp_auth_codes` (`expires_at`);--> statement-breakpoint
CREATE TABLE `mcp_oauth_clients` (
	`id` text PRIMARY KEY NOT NULL,
	`secret_hash` text,
	`name` text NOT NULL,
	`redirect_uris` text NOT NULL,
	`created_at` text NOT NULL
);
