const bot = require("../../telegram").bot;
const db = require("../../database").sqlite;
const link = require("../../link");
const narnia = require("../../narnia");
const env = process.env;

module.exports = {
    name: "ss_transmission_menu",
    access: "ss",
    func (callback) {
        let menu = [];

        const ss_chats = narnia.ss_chats;


        // js moment be like...
        ss_chats.filter(name => name != ss_chats[0]).forEach((chat_key, index) => {
            if (index % 3 == 0) {
                menu.push([]);
            }

            menu[menu.length - 1].push(
                {
                    text: `${narnia.group_names[chat_key]}`,
                    callback_data: link.gen_link(link.from, ["ss_transmission_message", chat_key])
                }
            );
        });

        menu.push([
            {
                text: "Назад",
                callback_data: link.gen_link(link.to, "ss_menu")
            }
        ])

        bot.editMessageText(`Кому будеш наярювать?`, {
            chat_id: callback.message.chat.id,
            message_id: callback.message.message_id,
            parse_mode: "HTML",
            disable_web_page_preview: true,
            reply_markup: {
                inline_keyboard: menu
            }
        });
    }
}
