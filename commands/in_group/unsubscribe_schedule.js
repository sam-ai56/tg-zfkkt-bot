const bot = require("../../telegram").bot;
const db = require("../../database").sqlite;
const env = process.env;

module.exports = {
    name: "unsubscribe_schedule",
    description: "Відписати групу від розсилки розкладу",
    type: "all_group_chats",
    chat_id: undefined,
    user_id: undefined,
    func (msg, args) {
        if(msg.chat.id == env.GROUP_ID)
            return;

        var username = msg.from.username? `@${msg.from.username}` : msg.from.first_name? msg.from.first_name : msg.from.last_name;

        bot.getChatMember(msg.chat.id, msg.from.id).then((member) => {
            if (member.status != "administrator" && member.status != "creator" && msg.from.id != env.OWNER_ID) {
                bot.sendMessage(msg.chat.id, "Ти не адміністратор групи.", {
                    reply_to_message_id: msg.message_id
                });
                return;
            }

            var group = db.prepare("SELECT * FROM GroupChat WHERE id = ?").get(msg.chat.id);
            if (group == undefined) {
                return;
            }

            const is_subscribed = db.prepare("SELECT * FROM GroupChat WHERE id = ? AND schedule_distribution = 0").get(msg.chat.id);
            if (is_subscribed != undefined) {
                bot.sendMessage(msg.chat.id, "Ви вже відписали групу від розсилки.", {
                    reply_to_message_id: msg.message_id
                });
                return;
            }

            db.prepare("INSERT OR IGNORE INTO GroupChat (id) VALUES (?)").run(msg.chat.id);
            db.prepare("UPDATE GroupChat SET [group] = NULL, schedule_distribution = 0 WHERE id = ?").run(msg.chat.id);
            bot.sendMessage(msg.chat.id, `${username} відписав групу від розсилки.`, {
                reply_to_message_id: msg.message_id
            });
        });
    }
}