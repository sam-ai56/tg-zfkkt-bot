const bot = require("../../telegram").bot;
const db = require("../../database").sqlite;
const env = process.env;
module.exports = {
    name: "help",
    description: "Інфо",
    type: "all_group_chats",
    chat_id: undefined,
    user_id: undefined,
    func (msg, args) {
        const help = require("../../help.json");
        var text = "";
            help.commands.forEach((command) => {
                if (command.type == "all_private_chats" || command.type == "chat")
                    return;

                text += `<b>/${command.name}</b> - ${command.help_description}\n\n`;
            }
        );
        bot.sendMessage(msg.chat.id, `${text}`, {
            parse_mode: "HTML",
            reply_to_message_id: msg.message_id,
            disable_web_page_preview: true
        });
    }
}