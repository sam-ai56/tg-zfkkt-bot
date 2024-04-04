const bot = require("../../telegram").bot;
const db = require("../../database").sqlite;
const link = require("../../link");
const middleware = require("../../middleware");
const narnia = require("../../narnia");
const env = process.env;

module.exports = {
    name: "ss_transmission_message",
    access: "ss",
    func (callback) {
        if (middleware.has_block(link.to, callback.message.chat.id, 5)){
            bot.editMessageText("Досить пиздіти, А? В тебе бан на 5 хвилин.", {
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
            return;
        }

        const send_to = narnia.get_value(link.data[0]);

        bot.sendMessage(send_to, `${callback.from.first_name} починає сеанс спиритизму. 🔮`);

        bot.editMessageText("Портал відчинено. Починай балбенькать. Щоб зупинити передачу натисни на кнопку нижче.", {
            chat_id: callback.message.chat.id,
            message_id: callback.message.message_id,
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "Всьо пропало",
                            callback_data: link.gen_link(link.to, link.from)
                        }
                    ]
                ]
            }
        }).then(() => {
            db.prepare("UPDATE User SET type = ? WHERE id = ?").run(callback.data, callback.message.chat.id);
        });
    }
}