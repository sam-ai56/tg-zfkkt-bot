const narnia = require("../../narnia");

const bot = require("../../telegram").bot;
const db = require("../../database").sqlite;
const env = process.env;
module.exports = {
    name: "get_chat_id",
    description: "some",
    type: "owner",
    chat_id: undefined,
    user_id: env.OWNER_ID,
    func (msg, args) {
        // bot.sendMessage(msg.chat.id, "O_^._.^_K");
        bot.sendMessage(env.OWNER_ID,
            `title: <b>${msg.chat.title}</b>, id: <code>${msg.chat.id}</code>`,
            {
                parse_mode: "HTML"
            }
        );
    }
}