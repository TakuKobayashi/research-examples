-- Auto-generated Drop Table Script for SQLITE
--

-- マイグレーション管理テーブルリセット
DELETE FROM d1_migrations;

-- 一時的に外部キー制約を無効化
PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS challenges;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS passkeys;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS users;

PRAGMA foreign_keys = ON;