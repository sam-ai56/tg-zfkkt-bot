const page = require("../page");
const bot = require("../telegram").bot;
const menu = require("../menu");
const env = process.env;

module.exports = {
    name: "schedule_menu",
    generate_link: true,
    func (callback) {
        bot.editMessageText("Меню розкладу:\n\n<i>*Бота можна додати до чату та підписати його на розсилку розкладу групи</i>", {
            chat_id: callback.message.chat.id,
            message_id: callback.message.message_id,
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: menu.schedule_menu(callback.message.chat.id)
            }
        });
    }
}