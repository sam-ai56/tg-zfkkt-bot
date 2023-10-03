const bot = require("../../telegram").bot;
const db = require("../../database").sqlite;
const link = require("../../link");
const env = process.env;

module.exports = {
    name: "remove_admin",
    func (callback) {
        const admin_id = link.data[0];
        db.prepare("UPDATE User SET is_admin = 0 WHERE id = ?").run(admin_id);

        bot.editMessageText("Адміністратор видалений", {
            chat_id: callback.message.chat.id,
            message_id: callback.message.message_id,
            reply_markup: {
                inline_keyboard: link.back_button(link.from)
            }
        });
    }
}
