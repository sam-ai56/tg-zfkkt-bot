const bot = require("../../telegram").bot;
const db = require("../../database").sqlite;
const env = process.env;
module.exports = {
    name: "ping",
    description: "ping",
    type: "owner",
    chat_id: undefined,
    user_id: env.OWNER_ID,
    func (msg, args) {
        bot.sendMessage(msg.chat.id, "Поцілуй мій блискучій металевий зад!", {
            reply_to_message_id: msg.message_id
        });
    }
}