const page = require("../page");
const bot = require("../telegram").bot;
const menu = require("../menu");

module.exports = {
    name: "menu",
    generate_link: true,
    func (callback) {
        bot.editMessageText("Що тобі потрібно сталкер?", {
            chat_id: callback.message.chat.id,
            message_id: callback.message.message_id,
            reply_markup: {
                inline_keyboard: menu.main_menu(callback.message.chat.id)
            }
        });
    }
}