const bot = require("../../telegram").bot;
const db = require("../../database").sqlite;
const link = require("../../link");
const env = process.env;

module.exports = {
    name: "audyt_info",
    async func (callback) {
        const data = link.data;
        const audyt = db.prepare("SELECT * FROM AudytLog WHERE id = ?").get(data[0]);
        const user = await bot.getChat(audyt.user_id);
        const date = new Date(audyt.at);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');

        const date_str = `${day}.${month}.${year}`;
        const time_str = `${hours}:${minutes}`;

        bot.editMessageText(`Час: ${time_str}\nДата: ${date_str}\nОпис: ${audyt.description}\nКористувач: @${user.username}`, {
            chat_id: callback.message.chat.id,
            message_id: callback.message.message_id,
            reply_markup: {
                inline_keyboard: link.back_button("audyt")
            }
        });
    }
}
