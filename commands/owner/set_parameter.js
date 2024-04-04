const narnia = require("../../narnia");

const bot = require("../../telegram").bot;
const db = require("../../database").sqlite;
const env = process.env;
module.exports = {
    name: "setp",
    description: "some",
    type: "chat",
    chat_id: env.OWNER_ID,
    user_id: undefined,
    func (msg, args) {

        if (!args[0] || !args[1]) {
            bot.sendMessage(msg.chat.id, "Помилка бла бла бла... Треба заповнити цю хуйню.");
            return;
        }

        narnia.set(args[0], args[1]);

        bot.sendMessage(msg.chat.id, narnia.list_variables(), {
            reply_to_message_id: msg.message_id,
            parse_mode: "HTML"
        });
    }
}