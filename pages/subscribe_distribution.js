const page = require("../page");
const bot = require("../telegram").bot;
const db = require("../database").sqlite;
const link = require("../link");

module.exports = {
    name: "subscribe_distribution",
    init () {
        page.register(this.name, (callback) => {
            var group_id = link.data[0];
            db.prepare('UPDATE User SET [group] = ?, distribution = 1 WHERE id = ?').run(group_id, callback.from.id);
            var group_name = db.prepare('SELECT name FROM [Group] WHERE id = ?').get(group_id).name;
            bot.editMessageText(`Ти підписався на розсилку (${group_name})`, {
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
        });
    }
}