const bot = require("../../telegram").bot;
const db = require("../../database").sqlite;
const link = require("../../link");
const env = process.env;

module.exports = {
    name: "su_schedule",
    description: "Підписати/відписати розсилку новин для групи.",
    help_description: "Адміністратор групи може підписати групу на розсилку розкладу. Розклад буде розсилатись за розкладом вибраної групи.",
    type: "all_group_chats",
    chat_id: undefined,
    user_id: undefined,
    async func (msg, args) {
        const is_admin = await bot.getChatMember(msg.chat.id, msg.from.id);

        if (is_admin.status != "administrator" && is_admin.status != "creator" && msg.from.id != env.OWNER_ID) {
            bot.sendMessage(msg.chat.id, "Ти не адміністратор групи.", {
                reply_to_message_id: msg.message_id
            });
            return;
        }

        const is_group_chosen = db.prepare("SELECT * FROM GroupChat WHERE id = ? AND [group] IS NOT NULL").get(msg.chat.id);
        if (!is_group_chosen) {
            bot.sendMessage(msg.chat.id, "Спочатку виберіть групу. /choose_group", {
                reply_to_message_id: msg.message_id
            });
            return;
        }

        const is_subscribed = db.prepare("SELECT * FROM GroupChat WHERE id = ? AND schedule_distribution = 1").get(msg.chat.id);
        if (is_subscribed) {
            db.prepare("UPDATE GroupChat SET schedule_distribution = 0 WHERE id = ?").run(msg.chat.id);
            bot.sendMessage(msg.chat.id, "Група відписана від розсилки розкладу.", {
                reply_to_message_id: msg.message_id
            });
            return;
        }

        db.prepare("UPDATE GroupChat SET schedule_distribution = 1 WHERE id = ?").run(msg.chat.id);
        bot.sendMessage(msg.chat.id, "Група підписана на розсилку розкладу.", {
            reply_to_message_id: msg.message_id
        });
    }
}