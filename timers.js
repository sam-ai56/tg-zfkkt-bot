const db = require("./database").sqlite;
const bot = require("./telegram").bot;

module.exports = {
    init() {
        // check every hour if there are any expired codes with 1 day lifetime delete them
        setTimeout(() => {
            db.prepare("DELETE FROM InviteCode WHERE created_at < ?").run(new Date().getTime() - 86400000);
        }, 3600000);
        
        setTimeout(() => {
            const users = db.prepare("SELECT * FROM User").all();
            users.map((user) => {
                if (user.first_name) {
                    bot.getChat(user.id).then((chat) => {
                        db.prepare("UPDATE User SET first_name = ?, last_name = ?, username = ? WHERE id = ?").run(chat.first_name, chat.last_name, chat.username, user.id);
                    });
                }
            });
        }, 3600000);
    },
};