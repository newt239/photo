ALTER TABLE `photos` ADD `content_hash` text;--> statement-breakpoint
CREATE INDEX `photos_user_content_hash_idx` ON `photos` (`user_id`,`content_hash`);