const page = require("../page");
const bot = require("../telegram").bot;
const link = require("../link");

module.exports = {
    name: "ss_about",
    generate_link: true,
    func (callback) {
        const text = require("../ss_about_text.json");
        bot.editMessageText(text, {
            chat_id: callback.message.chat.id,
            message_id: callback.message.message_id,
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "Назад",
                            callback_data: link.gen_link(link.to, link.from)
                        }
                    ]
                ]
            }
        });
    }
}