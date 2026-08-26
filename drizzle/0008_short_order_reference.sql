DROP INDEX IF EXISTS `orders_gateway_reference_idx`;--> statement-breakpoint
CREATE UNIQUE INDEX `orders_gateway_reference_idx` ON `orders` (`gateway_reference`);
