const bot = require("../../telegram").bot;
const db = require("../../database").sqlite;
module.exports = {
    name: "info",
    description: "Інформація про налаштування бота у групі",
    type: "all_group_chats",
    chat_id: undefined,
    user_id: undefined,
    func (msg, args) {
        const chat = db.prepare("SELECT * FROM GroupChat WHERE id = ?").get(msg.chat.id);
        var group = undefined;
        if (chat) {
            group = db.prepare("SELECT * FROM [Group] WHERE id = ?").get(chat.group);
        }

        var text = "";
        text += `<b><i>Група:</i></b> ${
            chat? 
                group.name? group.name : "Не вибрана"
                :
                "Не вибрана"
            }\n`;
        text += `<b><i>Розсилка розкладу:</i></b> ${chat? chat.schedule_distribution ? "Активна" : "Вимкнена" : "Вимкнена"}\n`;
        text += `<b><i>Розсилка новин:</i></b> ${chat? chat.news_distribution ? "Активна" : "Вимкнена" : "Вимкнена"}\n`;

        bot.sendMessage(msg.chat.id, text, {
            parse_mode: "HTML",
            reply_to_message_id: msg.message_id
        });
    }
}