const bot = require("../../telegram").bot;
const db = require("../../database").sqlite;
const link = require("../../link");
const env = process.env;

module.exports = {
    name: "show_admin",
    async func (callback) {
        const admin_id = link.data[0];
        const admin = db.prepare("SELECT * FROM User WHERE id = ?").get(admin_id);

        const user = await bot.getChat(admin_id);

        if(!user)
            return;

        bot.editMessageText(`Адміністратор: @${user.username}`, {
            chat_id: callback.message.chat.id,
            message_id: callback.message.message_id,
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "Видалити",
                            callback_data: link.gen_link("owner_menu", `remove_admin:${admin.id}`)
                        },
                        link.back_button(link.from, true)
                    ]
                ]
            }
        });
    }
}
