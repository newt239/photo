-- D1 は PRAGMA foreign_keys=OFF が効かず DROP TABLE `albums` が album_photos を cascade で消すため退避して復元する
CREATE TABLE `__backup_album_photos` AS SELECT * FROM `album_photos`;--> statement-breakpoint
CREATE TABLE `__new_albums` (
	`cover_photo_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`period_end` text,
	`period_start` text,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`user_id` text NOT NULL,
	`visibility` text NOT NULL,
	FOREIGN KEY (`cover_photo_id`) REFERENCES `photos`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_albums`("cover_photo_id", "created_at", "id", "period_end", "period_start", "slug", "title", "updated_at", "user_id", "visibility") SELECT "cover_photo_id", "created_at", "id", "period_end", "period_start", "slug", "title", "updated_at", "user_id", "visibility" FROM `albums`;--> statement-breakpoint
DROP TABLE `albums`;--> statement-breakpoint
ALTER TABLE `__new_albums` RENAME TO `albums`;--> statement-breakpoint
CREATE UNIQUE INDEX `albums_slug_idx` ON `albums` (`slug`);--> statement-breakpoint
CREATE INDEX `albums_user_id_idx` ON `albums` (`user_id`);--> statement-breakpoint
INSERT INTO `album_photos`("added_at", "album_id", "photo_id") SELECT "added_at", "album_id", "photo_id" FROM `__backup_album_photos`;--> statement-breakpoint
DROP TABLE `__backup_album_photos`;
