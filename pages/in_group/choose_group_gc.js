const bot = require("../../telegram").bot;
const db = require("../../database").sqlite;
const link = require("../../link");
const env = process.env;

module.exports = {
    name: "choose_group_gc",
    async func (callback) {
        var user = await bot.getChatMember(callback.message.chat.id, callback.from.id);
        if (user.status != "administrator" && user.status != "creator" && callback.from.id != env.OWNER_ID) {
            bot.answerCallbackQuery(callback.id, { text: "Ти не адміністратор групи." });
            return;
        }
        var group_id = link.data[0];
        var chat_id = callback.message.chat.id;
        db.prepare('UPDATE GroupChat SET [group] = ? WHERE id = ?').run(group_id, chat_id);
        var username = callback.from.username? `@${callback.from.username}` : callback.from.first_name? callback.from.first_name : callback.from.last_name;
        var group_name = db.prepare('SELECT name FROM [Group] WHERE id = ?').get(group_id).name;
        bot.editMessageText(`${username} вибрав групу для чату (${group_name})`, {
            chat_id: callback.message.chat.id,
            message_id: callback.message.message_id,
        });
    }
}
