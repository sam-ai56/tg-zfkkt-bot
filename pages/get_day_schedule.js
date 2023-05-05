const page = require("../page");
const bot = require("../telegram").bot;
const db = require("../database").sqlite;
const link = require("../link");
const week_days_schedule = [
    "Понеділок",
    "Вівторок",
    "Середу",
    "Четвер",
    "П'ятницю"
];

module.exports = {
    name: "get_day_schedule",
    init () {
        page.register(this.name, (callback) => {
            var group_id = link.data[0];
            var lday = link.data[1];
            if (lday == 6 || lday == 0) {
                lday = 1;
            }

            var schedule = db.prepare(`
                SELECT Schedule.day, Time.start_at as time_start_at, Time.end_at as time_end_at, Subject.name AS subject_name, [Group].name AS group_name, Teacher.name AS teacher_name, Room.name AS room_name
                FROM Schedule
                INNER JOIN Subject ON Schedule.subject_id = Subject.id
                INNER JOIN [Group] ON Schedule.group_id = [Group].id
                INNER JOIN Teacher ON Schedule.teacher_id = Teacher.id
                INNER JOIN Room ON Schedule.room_id = Room.id
                INNER JOIN Time ON Schedule.time_id = Time.id
                WHERE [Group].id = ?
            `).all(group_id);

            var days = [];
            schedule.map((item) => {
                if (!days.includes(item.day)) {
                    days.push(item.day);
                }
            });

            var days_menu = [];

            days.map((day, index) => {
                if (index % 3 == 0) {
                    days_menu.push([]);
                }
                
                days_menu[days_menu.length - 1].push(
                    {
                        text: week_days_schedule[day-1],
                        callback_data: link.gen_link(link.to, `show_schedule:${day}`)
                    }
                );
            });

            days_menu.push([
                {
                    text: "Назад",
                    callback_data: link.gen_link(link.to, `show_schedule:${lday}`)
                }
            ]);

            bot.editMessageText(`Вибери день`, {
                chat_id: callback.message.chat.id,
                message_id: callback.message.message_id,
                reply_markup: {
                    inline_keyboard: days_menu
                }
            });
        });
    }
}