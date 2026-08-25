CREATE TABLE `mcp_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`token_prefix` text NOT NULL,
	`label` text NOT NULL,
	`kind` text DEFAULT 'MANUAL' NOT NULL,
	`created_by` text NOT NULL,
	`client_id` text,
	`scope` text DEFAULT 'mcp' NOT NULL,
	`created_at` text NOT NULL,
	`expires_at` text,
	`last_used_at` text,
	`revoked_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mcp_tokens_token_hash_unique` ON `mcp_tokens` (`token_hash`);--> statement-breakpoint
CREATE INDEX `mcp_tokens_revoked_idx` ON `mcp_tokens` (`revoked_at`);