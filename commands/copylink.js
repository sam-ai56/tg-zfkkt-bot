const bot = require("../telegram").bot;
const db = require("../database").sqlite;

module.exports = {
    name: "copylink",
    description: "Скопіювати посилання на сторінку у боті",
    help: "Вам потрібно відповісти на повідомлення зі сторінкою, на яку ви хочете скопіювати посилання.",
    type: "all_private_chats",
    chat_id: undefined,
    user_id: undefined,
    func (msg, args) {
        const reply_msg = msg.reply_to_message;
        if (!reply_msg)
            return;

        const reply_markup = reply_msg.reply_markup;
        if (!reply_markup)
            return;

        const inline_keyboard = reply_markup.inline_keyboard;
        if (!inline_keyboard)
            return;

        const button = inline_keyboard.flat().find(item => item.callback_data);

        if (!button)
            return;

        const shorted_code = db.prepare("SELECT * FROM Link WHERE url = ?").get(button.callback_data.split(":")[0]);

        if (!shorted_code) {
            bot.sendMessage(msg.chat.id, "Не можливо скопіювати посилання.", {
                reply_to_message_id: msg.message_id
            });
            return;
        }

        bot.getMe().then((me) => {
            if (reply_msg.from.id != me.id)
                return;
            const link = `<code>https://t.me/${me.username}?start=${shorted_code.shorted}</code>`;
            bot.sendMessage(msg.chat.id, link, {
                reply_to_message_id: reply_msg.message_id,
                parse_mode: "HTML"
            });
        });
    }
}