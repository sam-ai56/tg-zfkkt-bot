const bot = require("../telegram").bot;
const db = require("../database").sqlite;
module.exports = {
    name: "bells",
    description: "Розклад дзвінків",
    help_description: "Виводить розклад дзвінків",
    type: "all_group_chats",
    chat_id: undefined,
    user_id: undefined,
    func (msg, args) {
        const bells = db.prepare("SELECT * FROM Time").all();
        var text = "";

        bells.forEach((time, index) => {
            text += `<b>${index+1} пара:</b> ${time.start_at} - ${time.end_at}\n`;
        });

        bot.sendMessage(msg.chat.id, `Розклад дзвінків:\n${text}`, {
            parse_mode: "HTML",
            reply_to_message_id: msg.message_id,
        });
    }
}