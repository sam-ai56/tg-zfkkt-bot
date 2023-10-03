const bot = require("../../telegram").bot;
const db = require("../../database").sqlite;
const link = require("../../link");
const env = process.env;

module.exports = {
    name: "audyt",
    func (callback) {
        const audyt = db.prepare("SELECT * FROM AudytLog").all();

        if (audyt.length == 0) {
            return bot.answerCallbackQuery(callback.id, "Журнал аудиту пустий", true);
        }

        var keyboard = [];

        audyt.forEach((element, index) => {
            const date = new Date(element.at);
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');

            const date_str = `${day}.${month}.${year}`;
            const time_str = `${hours}:${minutes}`;

            if (index % 2 == 0) {
                keyboard.push([]);
            }

            keyboard[keyboard.length - 1].push({
                text: `${time_str} / ${date_str}`,
                callback_data: link.gen_link("audyt", `audyt_info:${element.id}`)
            });
        });


        keyboard.reverse();

        keyboard.push([link.back_button("admin_menu", true)]);

        bot.editMessageText("Журнал аудиту.\n*аудит зберігається 5 днів", {
            chat_id: callback.message.chat.id,
            message_id: callback.message.message_id,
            reply_markup: {
                inline_keyboard: keyboard
            }
        });
    }
}
