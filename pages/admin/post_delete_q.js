const bot = require("../../telegram").bot;
const db = require("../../database").sqlite;
const link = require("../../link");
const env = process.env;

module.exports = {
    name: "post_delete_q",
    access: "admin",
    func (callback) {
        const data = link.data;
        const post_id = data[0];

        bot.editMessageText("Видалити пост?", {
            chat_id: callback.message.chat.id,
            message_id: callback.message.message_id,
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "Так",
                            callback_data: link.gen_link(link.to, `post_delete:1:${post_id}`)
                        },
                        {
                            text: "Ні",
                            callback_data: link.gen_link(link.to, `post_delete:0:${post_id}`)
                        }
                    ]
                ]
            }
        });

    }
}
