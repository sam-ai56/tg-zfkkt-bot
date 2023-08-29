const page = require("../page");
const bot = require("../telegram").bot;
const db = require("../database").sqlite;
const link = require("../link");

module.exports = {
    name: "show_bells_schedule",
    func (callback) {
        var schedule = db.prepare(`SELECT * FROM Time`).all();
        var text = "";

        schedule.forEach((time, index) => {
            text += `<b>${index+1} пара:</b> ${time.start_at} - ${time.end_at}\n`;
        });

        bot.editMessageText(`Розклад дзвінків:\n${text}`, {
            chat_id: callback.message.chat.id,
            message_id: callback.message.message_id,
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "Назад",
                            callback_data: link.gen_link(link.to, "schedule_menu")
                        }
                    ]
                ]
            }
        });
    }
}