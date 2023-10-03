const bot = require("../../telegram").bot;
const db = require("../../database").sqlite;
const link = require("../../link");
const env = process.env;

module.exports = {
    name: "post_delete",
    func (callback) {
        const data = link.data;
        const post_id = data[1];

        if (data[0] == "0") {
            return bot.editMessageText("Видаленя скасовано", {
                chat_id: callback.message.chat.id,
                message_id: callback.message.message_id,
                reply_markup: {
                    inline_keyboard: link.back_button(`post_menu:${post_id}`)
                }
            });
        }

        db.prepare("SELECT * FROM PostDistribution WHERE post_id = ?").all(post_id).forEach((post) => {
            bot.deleteMessage(post.chat_id, post.message_id);
            db.prepare("DELETE FROM PostDistribution WHERE message_id = ?").run(post.message_id);
        });

        db.prepare("DELETE FROM PostContent WHERE post_id = ?").run(post_id);
        db.prepare("DELETE FROM Post WHERE id = ?").run(post_id);

        db.prepare("INSERT INTO AudytLog (user_id, description, post_id, at) VALUES (?, ?, ?, ?)").run(callback.from.id, "Видалення поста", post_id, Date.now());

        bot.editMessageText("Пост видалено", {
            chat_id: callback.message.chat.id,
            message_id: callback.message.message_id,
            reply_markup: {
                inline_keyboard: link.back_button("admin_menu")
            }
        });
    }
}
