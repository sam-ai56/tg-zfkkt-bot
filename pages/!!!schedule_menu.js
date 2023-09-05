const page = require("../page");
const bot = require("../telegram").bot;
const menu = require("../menu");

module.exports = {
    name: "schedule_menu",
    func (callback) {
        bot.answerCallbackQuery(callback.id, "🗿");
        // bot.editMessageText("Меню розкладу:\n\n<i>*Бота можна додати до чату та підписати його на розсилку розкладу групи</i>", {
        //     chat_id: callback.message.chat.id,
        //     message_id: callback.message.message_id,
        //     parse_mode: "HTML",
        //     reply_markup: {
        //         inline_keyboard: menu.schedule_menu(callback.message.chat.id)
        //     }
        // });
    }
}