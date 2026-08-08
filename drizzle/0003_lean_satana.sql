CREATE INDEX `album_photos_cover_idx` ON `album_photos` (`album_id`,`sort_order`,`added_at`);--> statement-breakpoint
CREATE INDEX `photos_user_id_taken_at_idx` ON `photos` (`user_id`,`taken_at`);