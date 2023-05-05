const page = require("../page");
const bot = require("../telegram").bot;
const link = require("../link");
const db = require("../database").sqlite;
const middleware = require("../middleware");

module.exports = {
    name: "request_to_join_ss_text",
    init () {
        page.register(this.name, (callback) => {
            if (middleware.has_block(link.to, callback.message.chat.id, 30)){
                bot.editMessageText("Ти можеш відправити лише один запит на вступ у 30 хвилин.", {
                    chat_id: callback.message.chat.id,
                    message_id: callback.message.message_id,
                    reply_markup: {
                        inline_keyboard:[
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
            bot.editMessageText(`Добре, надішли мені: \n1. ПІБ.\n2. Групу\n3. Твій <b>"DiscordTag"</b>\n\n<i>писати як список не обов'язково</i>`, {
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