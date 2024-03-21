const bot = require("../../telegram").bot;
const db = require("../../database").sqlite;
const link = require("../../link");
const env = process.env;

module.exports = {
    name: "choose_admin",
    access: "owner",
    async func (callback) {
        const admins = db.prepare("SELECT * FROM User WHERE is_admin = 1").all();
        if (admins.length == 0){
            bot.answerCallbackQuery(callback.id, "Адміністраторів не знайдено");
            return
        }

        var keyboard = [];
        for (let i = 0; i < admins.length; i++) {
    	    let user = null;
    	    try {
        	user = await bot.getChat(admins[i].id);
            } catch (e) {
        	continue;
            }
            let is_username = user.username ? true : false;
            const username = is_username? user.username : user.first_name;
            keyboard.push([
                {
                    text: `${is_username? "@" : ""}${username}`,
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
