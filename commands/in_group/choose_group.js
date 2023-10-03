const bot = require("../../telegram").bot;
const db = require("../../database").sqlite;
const env = process.env;
const link = require("../../link");
module.exports = {
    name: "choose_group",
    description: "Вибрати групу для чату.",
    help_description: "Адміністратор групи може вибрати групу для чату. Це потрібно для розсилки розкладу.",
    type: "all_group_chats",
    chat_id: undefined,
    user_id: undefined,
    func (msg, args) {
        bot.getChatMember(msg.chat.id, msg.from.id).then((member) => {
            if (member.status != "administrator" && member.status != "creator" && msg.from.id != env.OWNER_ID) {
                bot.sendMessage(msg.chat.id, "Ти не адміністратор групи.", {
                    reply_to_message_id: msg.message_id
                });
                return;
            }

            db.prepare("INSERT OR IGNORE INTO GroupChat (id) VALUES (?)").run(msg.chat.id);
            bot.sendMessage(msg.chat.id, "Виберіть групу з для цього чату.", {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: 'Вибрати групу',
                                callback_data: link.gen_link('group_menu', `get_group_gc:0`)
                            }
                        ]
                    ]
                }
            });
        });
    }
}