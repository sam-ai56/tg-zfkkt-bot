const bot = require("../telegram").bot;
const db = require("../database").sqlite;
const link = require("../link");
const env = process.env;
const middleware = require("../middleware");

module.exports = {
    name: "schedule_mistake_text",
    func (callback) {
        if (middleware.has_block(link.to, callback.message.chat.id, 1)){
            bot.editMessageText("Ти можеш відправити лише одну скаргу у хвилину.", {
                chat_id: callback.message.chat.id,
                message_id: callback.message.message_id,
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "Назад",
                                callback_data: link.gen_link(link.to, "complaint_menu")
                            }
                        ]
                    ]
                }
            });
            return;
        }
        bot.editMessageText("Надішли мені деталі що до помилки.", {
            chat_id: callback.message.chat.id,
            message_id: callback.message.message_id,
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "Назад",
                            callback_data: link.gen_link(link.to, "complaint_menu")
                        }
                    ]
                ]
            }
        }).then(() => {
            db.prepare("UPDATE User SET type = ? WHERE id = ?").run(callback.data, callback.message.chat.id);
        });
    }
}
