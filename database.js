const Database = require("bun:sqlite").Database;
const db = new Database("sqlite.db"); // bun

module.exports = {
    sqlite: db,

    init() {
        db.exec(
            `
                CREATE TABLE IF NOT EXISTS User (
                    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    type TEXT,
                    [group] INTEGER DEFAULT NULL,
                    distribution INTEGER NOT NULL DEFAULT 0,
                    is_admin BOOLEAN NOT NULL DEFAULT 0
                );

                CREATE TABLE IF NOT EXISTS GroupChat (
                    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    [group] INTEGER DEFAULT NULL,
                    schedule_distribution INTEGER NOT NULL DEFAULT 0,
                    news_distribution INTEGER NOT NULL DEFAULT 1
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
                    name TEXT
                );

                CREATE TABLE IF NOT EXISTS Time (
                    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    start_at TEXT NOT NULL,
                    end_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS Distribution (
                    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    type TEXT NOT NULL DEFAULT "schedule",
                    schedule_id INTEGER,
                    chat_id INTEGER,
                    FOREIGN KEY (schedule_id) REFERENCES Schedule(id)
                );

                CREATE TABLE IF NOT EXISTS Schedule (
                    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    day INTEGER NOT NULL,
                    time_id INTEGER NOT NULL,
                    subject_id INTEGER,
                    group_id INTEGER NOT NULL,
                    teacher_id INTEGER,
                    room_id INTEGER,
                    FOREIGN KEY (time_id) REFERENCES Time(id),
                    FOREIGN KEY (subject_id) REFERENCES Subject(id),
                    FOREIGN KEY (group_id) REFERENCES [Group](id),
                    FOREIGN KEY (teacher_id) REFERENCES Teacher(id),
                    FOREIGN KEY (room_id) REFERENCES Room(id)
                );

                CREATE TABLE IF NOT EXISTS Link (
                    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    shorted TEXT NOT NULL UNIQUE,
                    type TEXT NOT NULL,
                    url TEXT NOT NULL,
                    expired_at INTEGER
                );

                CREATE TABLE IF NOT EXISTS Post (
                    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    created_by INTEGER NOT NULL,
                    created_at INTEGER NOT NULL,
                    posted_at INTEGER,
                    posted BOOLEAN NOT NULL DEFAULT 0,
                    to_channel BOOLEAN NOT NULL DEFAULT 0,
                    to_group BOOLEAN NOT NULL DEFAULT 0,
                    FOREIGN KEY (created_by) REFERENCES User(id)
                );

                CREATE TABLE IF NOT EXISTS PostContent (
                    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    post_id INTEGER NOT NULL,
                    post_object TEXT NOT NULL,
                    FOREIGN KEY (post_id) REFERENCES Post(id)
                );

                CREATE TABLE IF NOT EXISTS PostDistribution (
                    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    post_id INTEGER NOT NULL,
                    chat_id INTEGER NOT NULL,
                    message_id INTEGER NOT NULL,
                    FOREIGN KEY (post_id) REFERENCES Post(id)
                );

                CREATE TABLE IF NOT EXISTS AudytLog (
                    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    title TEXT NOT NULL,
                    description TEXT,
                    post_id INTEGER,
                    at INTEGER NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES User(id)
                );
            `
        );

        db.exec(`
                CREATE TABLE IF NOT EXISTS Transmission (
                    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    original_msg_chat_id INTEGER NOT NULL,
                    original_msg_id INTEGER NOT NULL,
                    sent_msg_id INTEGER NOT NULL,
                    sent_to_chat_id INTEGER NOT NULL
                );
            `
        );
    }
}