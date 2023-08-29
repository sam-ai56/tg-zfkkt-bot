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
    name: "show_schedule",
    func (callback) {
        var group_id = db.prepare("SELECT [group] FROM User WHERE id = ?").get(callback.message.chat.id).group;
        var day = Number(link.data[0]);
        var day_now = new Date().getDay();

        if (link.from == "schedule_menu") {
            day = day_now;
        }

        const query = `
            SELECT Schedule.day, Time.start_at as time_start_at, Time.end_at as time_end_at, Subject.name AS subject_name, [Group].name AS group_name, Teacher.name AS teacher_name, Room.name AS room_name
            FROM Schedule 
            INNER JOIN Subject ON Schedule.subject_id = Subject.id 
            INNER JOIN [Group] ON Schedule.group_id = [Group].id 
            INNER JOIN Teacher ON Schedule.teacher_id = Teacher.id 
            INNER JOIN Room ON Schedule.room_id = Room.id 
            INNER JOIN Time ON Schedule.time_id = Time.id
            WHERE [Group].id = ?
            AND Schedule.day = ?
        `

        while (db.prepare(query).all(group_id, day).length == 0) {
            day++;
            if (day > 5) {
                day = 1;
            }
        }

        var schedule = db.prepare(query).all(group_id, day);
            

        var schedule_text = "";
        schedule.forEach((item, index) => {
            schedule_text += `╭─ <b>${index+1} пара </b>(${item.time_start_at} - ${item.time_end_at}):\n`
            schedule_text += `│ •  <b>Предмет</b>: ${item.subject_name != null? item.subject_name: "НІЧОГО"}\n`
            schedule_text += `│ •  <b>Вчитель</b>: ${item.teacher_name != null? item.teacher_name: "НІЧОГО"}\n`
            schedule_text += `│ •  <b>Де</b>: ${item.room_name}\n`;
            if (schedule[index+1] != undefined && schedule[index+1].time_start_at != item.time_start_at || index == schedule.length-1){
                schedule_text += `╰───────\n`
            }
            
            if (schedule[index+1] != undefined && schedule[index+1].time_start_at == item.time_start_at) {
                var next_schedule = schedule[index+1];
                // schedule_text += `╭───\n`
                schedule_text += `├───────\n`
                schedule_text += `│ ◿  <i><b>Предмет</b></i>: ${next_schedule.subject_name != null? next_schedule.subject_name: "НІЧОГО"}\n`
                schedule_text += `│ ◿  <i><b>Вчитель</b></i>: ${next_schedule.teacher_name != null? next_schedule.teacher_name: " НІЧОГО"}\n`
                schedule_text += `│ ◿  <i><b>Де</b></i>: ${next_schedule.room_name}\n`;
                schedule_text += `╰─────────────\n`;
                schedule.splice(index+1, 1);
            }
            schedule_text += "\n";
        });


        bot.editMessageText(`Розклад на ${week_days_schedule[day-1].toLowerCase()} (${schedule[0].group_name}):\n\n${schedule_text}`, {
            chat_id: callback.message.chat.id,
            message_id: callback.message.message_id,
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "🐈 Інший день",
                            callback_data: link.gen_link(link.to, `get_day_schedule:${group_id}:${day}`)
                        },
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