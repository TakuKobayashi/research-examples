CREATE TABLE `queue_players` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'waiting' NOT NULL,
	`room_id` text,
	`opponent_id` text,
	`created_at` integer NOT NULL
);
