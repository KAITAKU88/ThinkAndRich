CREATE TABLE `post_translations` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`language` text NOT NULL,
	`title` text NOT NULL,
	`summary_snippet` text NOT NULL,
	`full_content` text NOT NULL,
	`academic_formula` text,
	`key_takeaways` text,
	`tags` text,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`translated_by` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `post_translations_post_language_idx` ON `post_translations` (`post_id`,`language`);--> statement-breakpoint
CREATE INDEX `post_translations_language_idx` ON `post_translations` (`language`);