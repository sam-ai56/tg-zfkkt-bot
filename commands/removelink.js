const bot = require("../telegram").bot;
const db = require("../database").sqlite;
const env = process.env;
const link = require("../link");
module.exports = {
    name: "removelink",
    description: undefined,
    type: undefined,
    chat_id: undefined,
    user_id: undefined,
    func (msg, args) {
        if(args.length == 0)
            return;

        if(args[0].match(/https:\/\/t.me\/[a-zA-Z0-9_]+\?start=[a-zA-Z0-9_]+/)) {
            const shorted_code = args[0].split("?start=")[1];
            const link_obj = db.prepare("SELECT * FROM Link WHERE shorted = ? AND type = 'link'").get(shorted_code);
            if(!link_obj) {
                bot.sendMessage(msg.chat.id, "Посилання не знайдено.", {
                    reply_to_message_id: msg.message_id
                });
                return;
            }
            db.prepare("DELETE FROM Link WHERE shorted = ?").run(shorted_code);
            bot.sendMessage(msg.chat.id, "Посилання успішно видалено.", {
                reply_to_message_id: msg.message_id
            });
            return;
        }

        // check by shorted code
        const shorted_code = args[0];
        const link_obj = db.prepare("SELECT * FROM Link WHERE shorted = ? AND type = 'link'").get(shorted_code);
        if(!link_obj) {
            bot.sendMessage(msg.chat.id, "Посилання не знайдено.", {
                reply_to_message_id: msg.message_id
            });
            return;
        }
        db.prepare("DELETE FROM Link WHERE shorted = ?").run(shorted_code);
        bot.sendMessage(msg.chat.id, "Посилання успішно видалено.", {
            reply_to_message_id: msg.message_id
        });
    }
}