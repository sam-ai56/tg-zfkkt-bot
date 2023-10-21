const bot = require("../../telegram").bot;
const db = require("../../database").sqlite;
const link = require("../../link");
const env = process.env;

module.exports = {
    name: "post_menu",
    async func (callback) {
        const data = link.data;
        const post_id = data[0];
        const post = db.prepare("SELECT * FROM Post WHERE id = ?").get(post_id);
        const date = new Date(post.posted_at);

        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');

        const date_str = `${day}.${month}.${year}`;
        const time_str = `${hours}:${minutes}`;

        const user = await bot.getChat(post.created_by);
        let is_username = user.username ? true : false;
        const username = is_username? user.username : user.first_name;

        bot.editMessageText(`Час публікації: ${time_str}\nДата публікації: ${date_str}\nОпубліковав: ${is_username? "@" : ""}${username}\nВідправлено до: (${post.to_channel? "каналу": ""}${post.to_group? ", чатів": ""})`, {
            chat_id: callback.message.chat.id,
            message_id: callback.message.message_id,
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "Показати",
                            callback_data: link.gen_link("post_menu", `post_preview:${post_id}`)
                        },
                        {
                            text: "Видалити",
                            callback_data: link.gen_link("post_menu", `post_delete_q:${post_id}`)
                        }
                    ],
                    [
                        link.back_button("posts", true)
                    ]
                ]
            }
        });
    }
}
