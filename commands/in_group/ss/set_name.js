const narnia = require("../../../narnia");

const bot = require("../../../telegram").bot;
const db = require("../../../database").sqlite;
const env = process.env;
module.exports = {
    name: "set_name",
    description: "some",
    type: "chat",
    chat_id: narnia.get_value(narnia.ss_chats[0]),
    user_id: undefined,
    func (msg, args) {
        if (args.length < 1) {
            bot.sendMessage(msg.chat.id, "Ім'я де?", {
                reply_to_message_id: msg.message_id
            });
            return;
        }

        db.prepare("UPDATE User SET ss_name = ? WHERE is_ss = 1 AND id = ?").run(args.join(" "), msg.from.id);

        bot.sendMessage(msg.chat.id, "Ім'я оновлено.", {
            reply_to_message_id: msg.message_id
        });
    }
}