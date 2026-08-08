DROP INDEX `photos_user_content_hash_idx`;--> statement-breakpoint
CREATE UNIQUE INDEX `photos_user_content_hash_idx` ON `photos` (`user_id`,`content_hash`);