const bot = require("../../telegram").bot;
const db = require("../../database").sqlite;
const link = require("../../link");
const env = process.env;

module.exports = {
    name: "choose_admin",
    async func (callback) {
        const admins = db.prepare("SELECT * FROM User WHERE is_admin = 1").all();
        if (admins.length == 0){
            bot.answerCallbackQuery(callback.id, "Адміністраторів не знайдено");
            return
        }

        var keyboard = [];
        for (var i = 0; i < admins.length; i++) {
            const user = await bot.getChat(admins[i].id);
            keyboard.push([
                {
                    text: `@${user.username}`,
                    callback_data: link.gen_link(link.to, `show_admin:${admins[i].id}`)
                }
            ]);
        }

        keyboard.push([link.back_button("owner_menu", true)]);

        bot.editMessageText("Виберіть адміністратора", {
            chat_id: callback.message.chat.id,
            message_id: callback.message.message_id,
            reply_markup: {
                inline_keyboard: keyboard
            }
        });
    }
}
