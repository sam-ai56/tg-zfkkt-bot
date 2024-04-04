const bot = require("../../telegram").bot;
const db = require("../../database").sqlite;
const env = process.env;

module.exports = {
    name: "say",
    description: "Пизданути якусь хуйню адмінам",
    type: "chat",
    chat_id: env.OWNER_ID,
    user_id: undefined,
    func (msg, args) {
        const admins = db.prepare("SELECT * FROM User WHERE is_admin = 1").all();
        if(admins.lenght == 0)
            return bot.sendMessage(msg.chat.id, "Нема в тебе адмінів :(", {
                reply_to_message_id: msg.message_id
            });

        let text = args.join(" ");

        admins.forEach(admin => {
            if (admin.id == env.OWNER_ID)
                return;
            bot.sendMessage(admin.id, text);
        });

        bot.sendMessage(msg.chat.id, "готово");
    }
}