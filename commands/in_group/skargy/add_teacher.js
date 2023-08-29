const bot = require("../../../telegram").bot;
const db = require("../../../database").sqlite;
const env = process.env;

module.exports = {
    name: "add_teacher",
    description: "додати викладача",
    type: "chat",
    chat_id: env.GROUP_ID,
    user_id: undefined,
    func (msg, args) {
        if (args.length == 0) {
            bot.sendMessage(msg.chat.id, "Ім'я викладача не вказано.", {reply_to_message_id: msg.message_id});
            return;
        }

        var arg = "";
        args.forEach((a, i) => {
            if (i != 0)
                arg += " ";
            arg += `${a}`;
        });

        if (db.prepare("SELECT * FROM Teacher WHERE name = ?").get(arg) == undefined){
            db.prepare("INSERT INTO Teacher (name) VALUES (?)").run(arg);
            bot.sendMessage(msg.chat.id, `Викладача ${arg} додано.`);
            return;
        }
        bot.sendMessage(msg.chat.id, `Викладач ${arg} вже є.`, {reply_to_message_id: msg.message_id});
    }
}