const page = require("../page");
const bot = require("../telegram").bot;
const link = require("../link");
const db = require("../database").sqlite;
const middleware = require("../middleware");

module.exports = {
    name: "offer_text",
    init () {
        page.register(this.name, (callback) => {
            if (middleware.has_block(link.to, callback.message.chat.id, 10)){
                bot.editMessageText("Ти можеш відправити лише одну пропозицію у 10 хвилин.", {
                    chat_id: callback.message.chat.id,
                    message_id: callback.message.message_id,
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "Назад",
                                    callback_data: link.gen_link(link.to, link.from)
                                }
                            ]
                        ]
                    }
                });
                return;
            }

            bot.editMessageText("Що в тебе є сталкер?\n\n<i>відправляй декілька пропозицій одним текстом</i>", {
                chat_id: callback.message.chat.id,
                message_id: callback.message.message_id,
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "Назад",
                                callback_data: link.gen_link(link.to, link.from)
                            }
                        ]
                    ]
                },
                parse_mode: "HTML"
            }).then(() => {
                db.prepare("UPDATE User SET type = ? WHERE id = ?").run(callback.data, callback.message.chat.id);
            });
        });
    }
}