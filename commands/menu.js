const command = require("../command");
const bot = require("../telegram").bot;
const menu = require("../menu");
const db = require("../database").sqlite;

module.exports = {
    name: "menu",
    description: "Відкриває меню",
    type: "all_private_chats",
    chat_id: undefined,
    user_id: undefined,
    func (msg, args) {
        db.prepare("INSERT OR IGNORE INTO User (id) VALUES (?)").run(msg.chat.id);
        bot.sendMessage(msg.chat.id, "Що тобі потрібно сталкер?", {
            reply_markup: {
                inline_keyboard: menu.main_menu(msg.chat.id)
            }
        });
    }
}