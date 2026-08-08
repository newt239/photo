DROP INDEX `album_photos_cover_idx`;--> statement-breakpoint
CREATE INDEX `album_photos_cover_idx` ON `album_photos` (`album_id`,`added_at`);--> statement-breakpoint
ALTER TABLE `album_photos` DROP COLUMN `sort_order`;