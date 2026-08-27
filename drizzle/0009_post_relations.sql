CREATE TABLE `post_relations` (
	`source_post_id` text NOT NULL,
	`related_post_id` text NOT NULL,
	`position` integer NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`source_post_id`, `related_post_id`),
	FOREIGN KEY (`source_post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`related_post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `post_relations_source_position_idx` ON `post_relations` (`source_post_id`,`position`);--> statement-breakpoint
CREATE INDEX `post_relations_related_post_idx` ON `post_relations` (`related_post_id`);
