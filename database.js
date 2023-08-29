const db = require("better-sqlite3")("sqlite.db");

module.exports = {
    sqlite: db,

    init() {
        db.exec(
            `
                CREATE TABLE IF NOT EXISTS User (
                    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    type TEXT,
                    [group] INTEGER DEFAULT NULL,
                    distribution INTEGER NOT NULL DEFAULT 0
                );

                CREATE TABLE IF NOT EXISTS GroupChat (
                    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    [group] INTEGER DEFAULT NULL,
                    schedule_distribution INTEGER NOT NULL DEFAULT 0,
                    news_distribution INTEGER NOT NULL DEFAULT 0
                );

                CREATE TABLE IF NOT EXISTS Teacher (
                    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    name TEXT
                );

                CREATE TABLE IF NOT EXISTS BlockList (
                    id INTEGER NOT NULL,
                    type TEXT NOT NULL,
                    time INTEGER NOT NULL
                );

                CREATE TABLE IF NOT EXISTS Subject (
                    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    name TEXT
                );

                CREATE TABLE IF NOT EXISTS [Group] (
                    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS Teacher (
                    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    name TEXT
                );

                CREATE TABLE IF NOT EXISTS Room (
                    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS Time (
                    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    start_at TEXT NOT NULL,
                    end_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS Distribution (
                    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    schedule_id INTEGER NOT NULL,
                    FOREIGN KEY (schedule_id) REFERENCES Schedule(id)
                );

                CREATE TABLE IF NOT EXISTS Schedule (
                    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    day INTEGER NOT NULL,
                    time_id INTEGER NOT NULL,
                    subject_id INTEGER NOT NULL,
                    group_id INTEGER NOT NULL,
                    teacher_id INTEGER NOT NULL,
                    room_id INTEGER NOT NULL,
                    FOREIGN KEY (time_id) REFERENCES Time(id),
                    FOREIGN KEY (subject_id) REFERENCES Subject(id),
                    FOREIGN KEY (group_id) REFERENCES [Group](id),
                    FOREIGN KEY (teacher_id) REFERENCES Teacher(id),
                    FOREIGN KEY (room_id) REFERENCES Room(id)
                );

                CREATE TABLE IF NOT EXISTS Schedule2 (
                    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    day INTEGER NOT NULL,
                    time_id INTEGER NOT NULL,
                    subject_id INTEGER NOT NULL,
                    group_id INTEGER NOT NULL,
                    teacher_id INTEGER NOT NULL,
                    room_id INTEGER NOT NULL,
                    FOREIGN KEY (time_id) REFERENCES Time(id),
                    FOREIGN KEY (subject_id) REFERENCES Subject(id),
                    FOREIGN KEY (group_id) REFERENCES [Group](id),
                    FOREIGN KEY (teacher_id) REFERENCES Teacher(id),
                    FOREIGN KEY (room_id) REFERENCES Room(id)
                );
            `
        );
    },
}