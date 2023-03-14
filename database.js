const db = require("better-sqlite3")("sqlite.db");

module.exports = {
    sqlite: db,

    init() {
        db.exec(
            `
                CREATE TABLE IF NOT EXISTS User (
                    "id" INTEGER PRIMARY KEY NOT NULL,
                    "type" TEXT,
                    "username" TEXT,
                    "first_name" TEXT,
                    "last_name" TEXT,
                    "is_admin" INTEGER NOT NULL DEFAULT 0
                );
            `
        );

        db.exec(
            `
                CREATE TABLE IF NOT EXISTS InviteCode (
                    "code" TEXT NOT NULL,
                    "user_id" INTEGER,
                    "type" TEXT NOT NULL,
                    "created_at" INTEGER NOT NULL,
                    PRIMARY KEY("code")
                );
            `
        );

        db.exec(
            `
                CREATE TABLE IF NOT EXISTS Teacher (
                    "id" INTEGER NOT NULL,
                    "name" TEXT NOT NULL,
                    PRIMARY KEY("id" AUTOINCREMENT)
                );
            `
        );

        db.exec(
            `
                CREATE TABLE IF NOT EXISTS BlockList (
                    "id" INTEGER NOT NULL,
                    "type" TEXT NOT NULL,
                    "time" INTEGER NOT NULL
                );
            `
        );
        
        db.exec(
            `
                CREATE TABLE IF NOT EXISTS "ScheduleSettings" (
                    "id" INTEGER NOT NULL,
                    "mailing_enabled" INTEGER NOT NULL DEFAULT 0,
                    "group" INTEGER,
                    PRIMARY KEY("id")
                );
            `
        );
    },
}