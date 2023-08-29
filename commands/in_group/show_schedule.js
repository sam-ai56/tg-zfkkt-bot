const bot = require("../../telegram").bot;
const db = require("../../database").sqlite;
const env = process.env;

const week_days_schedule = [
    "Понеділок",
    "Вівторок",
    "Середу",
    "Четвер",
    "П'ятницю"
];

const input_weeks = {
    "понеділок": 1,
    "пон":       1,
    "вівторок":  2,
    "вів":       2,
    "середа":    3,
    "сер":       3,
    "середу":    3,
    "четвер":    4,
    "чет":       4,
    "пятниця":   5,
    "пятницю":   5,
    "пят":       5
}

module.exports = {
    name: "show_schedule",
    description: "????",
    type: "all_group_chats",
    chat_id: undefined,
    user_id: undefined,
    func (msg, args) {
        if(msg.from.id != env.OWNER_ID)
            return;

        const date = new Date();

        var group_id = db.prepare("SELECT [group] FROM GroupChat WHERE id = ?").get(msg.chat.id).group;
        var day = 0;

        if (args.length == 0) {
            day = date.getDay();
        } else {
            const week_name = args[0].toLowerCase().replace(/`/g, "").replace(/'/g, "");
            if (input_weeks[week_name] != undefined) {
                day = input_weeks[week_name];
            } else {
                bot.sendMessage(msg.chat.id, "Шо?", {
                    reply_to_message_id: msg.message_id
                });
                return;
            }
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
            console.log(day);
            day++;
            if (day > 5) {
                day = 1;
            }
        }

        var schedule = db.prepare(query).all(group_id, day);

        var schedule_text = "";
        schedule.forEach((item, index) => {
            schedule_text += `╭─ <b>${index+1} пара </b>(${item.time_start_at} - ${item.time_end_at}):\n`
            schedule_text += `│ •  <b>Предмет</b>: ${item.subject_name != null? item.subject_name: "ПУСТО"}\n`
            schedule_text += `│ •  <b>Вчитель</b>: ${item.teacher_name != null? item.teacher_name: " ПУСТО"}\n`
            schedule_text += `│ •  <b>Де</b>: ${item.room_name}\n`;
            if (schedule[index+1] != undefined && schedule[index+1].time_start_at != item.time_start_at || index == schedule.length-1){
                schedule_text += `╰───────\n`
            }

            if (schedule[index+1] != undefined && schedule[index+1].time_start_at == item.time_start_at) {
                var next_schedule = schedule[index+1];
                // schedule_text += `╭───\n`
                schedule_text += `├───────\n`
                schedule_text += `│ ◿  <i><b>Предмет</b></i>: ${next_schedule.subject_name != null? next_schedule.subject_name: "ПУСТО"}\n`
                schedule_text += `│ ◿  <i><b>Вчитель</b></i>: ${next_schedule.teacher_name != null? next_schedule.teacher_name: " ПУСТО"}\n`
                schedule_text += `│ ◿  <i><b>Де</b></i>: ${next_schedule.room_name}\n`;
                schedule_text += `╰─────────────\n`;
                schedule.splice(index+1, 1);
            }
            schedule_text += "\n";
        });

        bot.sendMessage(msg.chat.id, `Розклад на ${week_days_schedule[day-1].toLowerCase()} (${schedule[0].group_name}):\n\n${schedule_text}`, {
            parse_mode: "HTML",
            reply_to_message_id: msg.message_id
        });
    }
}