const bot = require("../../telegram").bot;
const db = require("../../database").sqlite;
const env = process.env;

module.exports = {
    name: "unsubscribe_news",
    description: "Відписати групу від розсилки новин",
    type: "all_group_chats",
    chat_id: undefined,
    user_id: undefined,
    func (msg, args) {
        if(msg.chat.id == env.GROUP_ID)
            return;
        const is_subscribed = db.prepare("SELECT * FROM GroupChat WHERE id = ? AND news_distribution = 0").get(msg.chat.id);
        if (is_subscribed != undefined) {
            bot.sendMessage(msg.chat.id, "Ви вже відписали групу від розсилки новин.", {
                reply_to_message_id: msg.message_id
            });
            return;
        }

        bot.getChatMember(msg.chat.id, msg.from.id).then((member) => {
            if (member.status != "administrator" && member.status != "creator" && msg.from.id != env.OWNER_ID) {
                bot.sendMessage(msg.chat.id, "Ти не адміністратор групи.", {
                    reply_to_message_id: msg.message_id
                });
                return;
            }

            db.prepare("INSERT OR IGNORE INTO GroupChat (id) VALUES (?)").run(msg.chat.id);
            db.prepare("UPDATE GroupChat SET news_distribution = 0 WHERE id = ?").run(msg.chat.id);
            bot.sendMessage(msg.chat.id, "Група відписана від розсилки новин.", {
                reply_to_message_id: msg.message_id
            });
        });
    }
}