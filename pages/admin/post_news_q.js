const bot = require("../../telegram").bot;
const db = require("../../database").sqlite;
const link = require("../../link");
const env = process.env;

module.exports = {
    name: "post_news_q",
    access: "admin",
    func (callback) {
        const data = link.data;
        const post_id = data[1];

        switch (data[0]) {
            case "1":
                bot.editMessageText("Куди відправити?", {
                    chat_id: callback.message.chat.id,
                    message_id: callback.message.message_id,
                    reply_markup: {
                        inline_keyboard: [
                            [
                                // {
                                //     text: "Канал",
                                //     callback_data: link.gen_link(link.from, `post_news:1:${post_id}`)
                                // },
                                {
                                    text: "Усюди",
                                    callback_data: link.gen_link(link.from, `post_news:3:${post_id}`)
                                },
                                {
                                    text: "Тільки у групи",
                                    callback_data: link.gen_link(link.from, `post_news:2:${post_id}`)
                                }
                            ],
                            [
                                {
                                    text: "Відмінити",
                                    callback_data: link.gen_link(link.from, `post_news:0:${post_id}`)
                                }
                            ]
                        ]
                    }
                });
                break;
            case "0":
                db.prepare("DELETE FROM PostContent WHERE post_id = ?").run(post_id);
                db.prepare("DELETE FROM Post WHERE id = ?").run(post_id);
                bot.deleteMessage(callback.message.chat.id, callback.message.message_id);
                break;
        }
    }
}
