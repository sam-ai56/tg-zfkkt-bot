const narnia = require("../../narnia");

const bot = require("../../telegram").bot;
const db = require("../../database").sqlite;
const env = process.env;
module.exports = {
    name: "remp",
    description: "some",
    type: "chat",
    chat_id: env.OWNER_ID,
    user_id: undefined,
    func (msg, args) {

        if (!args[0]) {
            bot.sendMessage(msg.chat.id, "АЛЬО", {
                reply_to_message_id: msg.message_id
            });
            return;
        }

        let permanent_remove = args[1];

        if (permanent_remove == "true")
            permanent_remove = true;
        else
            permanent_remove = false;

        narnia.remove(args[0], permanent_remove);

        bot.sendMessage(msg.chat.id, narnia.list_variables(), {
            reply_to_message_id: msg.message_id,
            parse_mode: "HTML"
        });
    }
}