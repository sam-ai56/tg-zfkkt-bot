const page = require("../page");
const bot = require("../telegram").bot;
const menu = require("../menu");

module.exports = {
    name: "menu",
    init () {
        page.register(this.name, (callback) => {
            bot.editMessageText("Що тобі потрібно сталкер?", {
                chat_id: callback.message.chat.id,
                message_id: callback.message.message_id,
                reply_markup: {
                    inline_keyboard: menu.main_menu(callback.message.chat.id)
                }
            });
        });
    }
}