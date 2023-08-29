const page = require("../../page");
const bot = require("../../telegram").bot;
const menu = require("../../menu");
const link = require("../../link");

module.exports = {
    name: "group_menu",
    func (callback) {
        bot.editMessageText("SOME", {
            chat_id: callback.message.chat.id,
            message_id: callback.message.message_id,
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'Розклад',
                            callback_data: link.gen_link('group_menu', `show_group_schedule:2:1:0`)
                        },
                        {
                            text: 'Розклад 2',
                            callback_data: link.gen_link('group_menu', `show_group_schedule:2:1:0`)
                        }
                    ]
                ]
            }
        });
    }
}