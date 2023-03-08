const db = require("better-sqlite3")("sqlite.db");

module.exports = {
    sqlite: db,

    init() {
        db.exec(
            `
                CREATE TABLE IF NOT EXISTS User (
                    id INTEGER PRIMARY KEY NOT NULL, 
                    type TEXT NOT NULL
                );
            `
        );

        db.exec(
            `
                CREATE TABLE IF NOT EXISTS Teacher (
                    "id" INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    PRIMARY KEY("id" AUTOINCREMENT)
                );
            `
        );

        db.exec(
            `
                CREATE TABLE IF NOT EXISTS BlockList (
                    id INTEGER NOT NULL,
                    type TEXT NOT NULL,
                    time INTEGER NOT NULL
                );
            `
        );
    },
}