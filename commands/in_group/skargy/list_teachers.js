const bot = require("../../../telegram").bot;
const db = require("../../../database").sqlite;
const env = process.env;

module.exports = {
    name: "list_teachers",
    description: "список викладачів",
    type: "chat",
    chat_id: env.GROUP_ID,
    user_id: undefined,
    func (msg, args) {
        var teachers = db.prepare("SELECT * FROM Teacher ORDER BY name COLLATE NOCASE").all();
        teachers.shift();
        var teacher_text = "Викладачі:\n";
        teachers.forEach((teacher, index) => {
            teacher_text += `${index+1}: ${teacher.name}\n`;
        });
        bot.sendMessage(msg.chat.id, teacher_text, {reply_to_message_id: msg.message_id});
    }
}