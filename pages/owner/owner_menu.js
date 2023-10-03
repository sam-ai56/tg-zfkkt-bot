const bot = require("../../telegram").bot;
const db = require("../../database").sqlite;
const link = require("../../link");
const env = process.env;
const menu = require("../../menu");

module.exports = {
    name: "owner_menu",
    func (callback) {
        bot.editMessageText("Меню власника.", {
            chat_id: callback.message.chat.id,
            message_id: callback.message.message_id,
            reply_markup: {
                inline_keyboard: menu.owner_menu()
            }
        });
    }
}
