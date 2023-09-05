const bot = require("../../telegram").bot;
const db = require("../../database").sqlite;
const link = require("../../link");
const env = process.env;

module.exports = {
    name: "subscribe_schedule",
    description: "Підписати групу на розсилку розкладу",
    type: "all_group_chats",
    chat_id: undefined,
    user_id: undefined,
    func (msg, args) {
        if(msg.chat.id == env.GROUP_ID)
            return;

        const is_subscribed = db.prepare("SELECT * FROM GroupChat WHERE id = ? AND schedule_distribution = 1").get(msg.chat.id);
        if (is_subscribed != undefined) {
            bot.sendMessage(msg.chat.id, "Ви вже підписали групу на розсилку.", {
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
            bot.sendMessage(msg.chat.id, "Для того, щоб активувати розсилку для цього чату адміністратор повинен вибрати групу з меню після чого вона буде підписана на розсилку.", {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: 'Підписатися на розсилку',
                                callback_data: link.gen_link('group_menu', `get_group_distribution_gc:0`)
                            }
                        ]
                    ]
                }
            });
        });
    }
}