const bot = require("../../../telegram").bot;
const db = require("../../../database").sqlite;
const env = process.env;

module.exports = {
    name: "remove_teacher",
    description: "видалити викладача",
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
            bot.sendMessage(msg.chat.id, `Викладача ${arg} не існує.`, {reply_to_message_id: msg.message_id});
            return;
        }

        db.prepare("DELETE FROM Teacher WHERE name = ?").run(arg);
        bot.sendMessage(msg.chat.id, `${arg} видалено.`);
    }
}