const page = require("../page");
const bot = require("../telegram").bot;
const menu = require("../menu");

module.exports = {
    name: "complaint_menu",
    func (callback) {
        bot.editMessageText("Вибери тип скарги.", {
            chat_id: callback.message.chat.id,
            message_id: callback.message.message_id,
            reply_markup: {
                inline_keyboard: menu.complaint_menu()
            }
        });
    }
}