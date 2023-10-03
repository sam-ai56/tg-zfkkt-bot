const bot = require("../../telegram").bot;
const db = require("../../database").sqlite;
const link = require("../../link");
const env = process.env;

module.exports = {
    name: "posts",
    func (callback) {
        const posts = db.prepare("SELECT * FROM Post WHERE posted = 1").all();

        if(posts.length == 0) {
            return bot.answerCallbackQuery(callback.id, "Немає постів", true);
        }

        var keyboard = [];

        posts.forEach((post, index) => {
            const date = new Date(post.posted_at);
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');

            const date_str = `${day}.${month}.${year}`;
            const time_str = `${hours}:${minutes}`;

            if (index % 2 == 0) {
                keyboard.push([]);
            }

            keyboard[keyboard.length - 1].push({
                text: `${time_str} / ${date_str}`,
                callback_data: link.gen_link("posts", `post_menu:${post.id}`)
            });
        });

        keyboard.reverse();

        keyboard.push([
            link.back_button("admin_menu", true)
        ]);

        bot.editMessageText("Опубліковані пости:", {
            chat_id: callback.message.chat.id,
            message_id: callback.message.message_id,
            reply_markup: {
                inline_keyboard: keyboard
            }
        });
    }
}
