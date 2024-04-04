const narnia = require("../../narnia");

const bot = require("../../telegram").bot;
const db = require("../../database").sqlite;
const env = process.env;
module.exports = {
    name: "test",
    description: "some",
    type: "owner",
    chat_id: undefined,
    user_id: env.OWNER_ID,
    func (msg, args) {
        bot.sendMessage(narnia.get_value(args[0]), narnia.template_it("%test_variable%"));
    }
}