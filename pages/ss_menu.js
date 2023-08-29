const page = require("../page");
const bot = require("../telegram").bot;
const menu = require("../menu");

module.exports = {
    name: "ss_menu",
    fucn (callback) {
        bot.editMessageText("Ну що сталкер, вибирай.", {
            chat_id: callback.message.chat.id,
            message_id: callback.message.message_id,
            reply_markup: {
                inline_keyboard: menu.ss_menu()
            }
        });
    }
}