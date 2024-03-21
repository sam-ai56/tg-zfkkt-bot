const bot = require("../../telegram").bot;
const db = require("../../database").sqlite;
const link = require("../../link");


module.exports = {
    name: "add_admin",
    access: "owner",
    func (callback) {
        const date = new Date();
        const expired_at = date.getTime() + 86400000;
        const code = link.gen_code("invite_admin", "menu", expired_at);

        bot.editMessageText(
            "Відправте це посилання людині, яку ви хочете зробити адміном.\n\n"
            + "<i>посилання стане недійсним через 24 години, або після першого використання.</i>\n\n"
            + `<code>https://t.me/zfkkt_bot?start=${code}</code>`, {
            chat_id: callback.message.chat.id,
            message_id: callback.message.message_id,
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "Назад",
                            callback_data: link.gen_link(link.to, "owner_menu")
                        }
                    ]
                ]
            },
            disable_web_page_preview: true,
            parse_mode: "HTML"
        });
    }
}
