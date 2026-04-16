CREATE TABLE `album_photos` (
	`album_id` text NOT NULL,
	`photo_id` text NOT NULL,
	`sort_order` integer,
	`added_at` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`album_id`, `photo_id`),
	FOREIGN KEY (`album_id`) REFERENCES `albums`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`photo_id`) REFERENCES `photos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `album_photos_photo_id_idx` ON `album_photos` (`photo_id`);--> statement-breakpoint
CREATE TABLE `album_shares` (
	`album_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`album_id`, `user_id`),
	FOREIGN KEY (`album_id`) REFERENCES `albums`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `album_shares_user_id_idx` ON `album_shares` (`user_id`);--> statement-breakpoint
CREATE TABLE `albums` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text,
	`slug` text NOT NULL,
	`description` text,
	`cover_photo_id` text,
	`visibility` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`cover_photo_id`) REFERENCES `photos`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `albums_slug_idx` ON `albums` (`slug`);--> statement-breakpoint
CREATE INDEX `albums_user_id_idx` ON `albums` (`user_id`);--> statement-breakpoint
CREATE TABLE `photo_shares` (
	`photo_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`photo_id`, `user_id`),
	FOREIGN KEY (`photo_id`) REFERENCES `photos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `photo_shares_user_id_idx` ON `photo_shares` (`user_id`);--> statement-breakpoint
CREATE TABLE `photos` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text,
	`storage_key` text NOT NULL,
	`thumbnail_key` text,
	`mime_type` text NOT NULL,
	`file_size` integer NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`visibility` text NOT NULL,
	`taken_at` integer,
	`uploaded_at` integer DEFAULT (unixepoch()) NOT NULL,
	`latitude` real,
	`longitude` real,
	`altitude` real,
	`camera_make` text,
	`camera_model` text,
	`lens_model` text,
	`focal_length` real,
	`aperture` real,
	`shutter_speed` text,
	`iso` integer,
	`orientation` integer,
	`raw_exif` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `photos_user_id_idx` ON `photos` (`user_id`);--> statement-breakpoint
CREATE INDEX `photos_taken_at_idx` ON `photos` (`taken_at`);--> statement-breakpoint
CREATE INDEX `photos_lat_lng_idx` ON `photos` (`latitude`,`longitude`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text,
	`image_url` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_idx` ON `users` (`email`);