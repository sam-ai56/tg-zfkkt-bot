const page = require("../page");
const bot = require("../telegram").bot;
const db = require("../database").sqlite;
const link = require("../link");
const week_days_schedule = [
    "😡 Понеділок",
    "😕 Вівторок",
    "🫤 Середа",
    "😳 Четвер",
    "🥹 П'ятниця"
];

module.exports = {
    name: "get_day_group_schedule",
    func (callback) {
        var group_id = link.data[0];
        var lday = link.data[1];
        var last_menu_page = link.data[2];

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
        schedule.forEach((item) => {
            if (!days.includes(item.day)) {
                days.push(item.day);
            }
        });

        var days_menu = [];

        days.forEach((day, index) => {
            if (index % 3 == 0) {
                days_menu.push([]);
            }
            
            days_menu[days_menu.length - 1].push(
                {
                    text: week_days_schedule[day-1],
                    callback_data: link.gen_link(link.to, `show_group_schedule:${group_id}:${index+1}:${last_menu_page}`)
                }
            );
        });
        
        days_menu.push([
            {
                text: "Назад",
                callback_data: link.gen_link(link.to, `show_group_schedule:${group_id}:${lday}:${last_menu_page}`)
            }
        ]);

        bot.editMessageText(`Вибери день:`, {
            chat_id: callback.message.chat.id,
            message_id: callback.message.message_id,
            reply_markup: {
                inline_keyboard: days_menu
            }
        });
    }
}