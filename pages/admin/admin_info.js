const bot = require("../../telegram").bot;
const link = require("../../link");

const text = `https://t.me/zfkkt_bot?start=x7uR13g5`;

module.exports = {
    name: "admin_info",
    func (callback) {
        bot.editMessageText(text, {
            chat_id: callback.message.chat.id,
            message_id: callback.message.message_id,
            reply_markup: {
                inline_keyboard: link.back_button(link.from)
            },
            disable_web_page_preview: true
        });
    }
}
