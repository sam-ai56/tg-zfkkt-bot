const bot = require("../../telegram").bot;
const db = require("../../database").sqlite;
const link = require("../../link");
const env = process.env;

module.exports = {
    name: "admin_menu",
    func (callback) {
        bot.editMessageText("Меню адміністратора.", {
            chat_id: callback.message.chat.id,
            message_id: callback.message.message_id,
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "Пости",
                            callback_data: link.gen_link("admin_menu", "posts")
                        },
                        {
                            text: "Журнал аудиту",
                            callback_data: link.gen_link("admin_menu", "audyt")
                        },
                    ],
                    [
                        {
                            text: "Інфо для адмінів",
                            callback_data: link.gen_link("admin_menu", "admin_info")
                        }
                    ],
                    [
                        link.back_button("menu", true)
                    ]
                ]
            }
        });
    }
}
