const page = require("../page");
const bot = require("../telegram").bot;
const db = require("../database").sqlite;
const link = require("../link");

module.exports = {
    name: "unsubscribe_distribution",
    func (callback) {
        db.prepare('UPDATE User SET [group] = NULL, distribution = 0 WHERE id = ?').run(callback.from.id);
        bot.editMessageText(`Ти відписався від розсилки`, {
            chat_id: callback.message.chat.id,
            message_id: callback.message.message_id,
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "Назад",
                            callback_data: link.gen_link(link.to, "schedule_menu")
                        }
                    ]
                ]
            }
        });
    }
}