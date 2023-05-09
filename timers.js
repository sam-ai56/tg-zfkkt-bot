const db = require("./database").sqlite;
const bot = require("./telegram").bot;

module.exports = {
    init() {
        setInterval(() => {
            const date = new Date();
            var day = date.getDay();
            var time = String(date.getHours()).padStart(2, '0') + ":" + String(date.getMinutes()).padStart(2, '0');
            var schedules = db.prepare(`
                SELECT Schedule.id, Schedule.day, Schedule.group_id, Schedule.time_id, Time.start_at as time_start_at, Time.end_at as time_end_at, Subject.name AS subject_name, [Group].name AS group_name, Teacher.name AS teacher_name, Room.name AS room_name
                FROM Schedule 
                INNER JOIN Subject ON Schedule.subject_id = Subject.id 
                INNER JOIN [Group] ON Schedule.group_id = [Group].id 
                INNER JOIN Teacher ON Schedule.teacher_id = Teacher.id 
                INNER JOIN Room ON Schedule.room_id = Room.id 
                INNER JOIN Time ON Schedule.time_id = Time.id
                WHERE time_start_at <= ? AND time_end_at >= ? AND Schedule.day = ?;
            `).all(time, time, day);

            schedules.map((schedule, shedule_index) => {
                var distribution = db.prepare("SELECT * FROM Distribution WHERE schedule_id = ?").get(schedule.id);
                var alt_shedule = false;
                var alt_shedule_group = false;
                var google_classroom = false;
                if (distribution) 
                    return;
                
                db.prepare("INSERT INTO Distribution (schedule_id) VALUES (?)").run(schedule.id);
                var users = db.prepare("SELECT * FROM User WHERE [group] = ? AND distribution = 1").all(schedule.group_id);
                users.map((user) => {
                    var args = {
                        parse_mode: "HTML",
                    }

                    var chat = bot.getChat(user.id);
                    var name = chat.first_name;
                    if (chat.last_name != undefined) {
                        name += "" + chat.last_name;
                    }
                    var schedule_text = "У тебе розпочалась пара:\n\n";
                    schedule_text += `╭─ <b>${schedule.time_id} пара </b>(${schedule.time_start_at} - ${schedule.time_end_at})\n`
                    schedule_text += `│ •  <b>Предмет</b>: ${schedule.subject_name != null? schedule.subject_name: "ПУСТО"}\n`
                    schedule_text += `│ •  <b>Вчитель</b>: ${schedule.teacher_name != null? schedule.teacher_name: " ПУСТО"}\n`
                    schedule_text += `│ •  <b>Де</b>: ${schedule.room_name}\n`;
                    schedule_text += `╰───────\n`;

                    if (schedule.room_name == "Google Classroom") {
                        google_classroom = true;
                    }
                    
                    if (schedules[shedule_index+1] != undefined && schedules[shedule_index+1].time_start_at == schedule.time_start_at && schedules[shedule_index+1].group_id == schedule.group_id) {
                        var next_schedule = schedules[shedule_index+1];
                        schedule_text += `╭───\n`
                        schedule_text += `│ ◿  <i><b>Предмет</b></i>: ${next_schedule.subject_name != null? next_schedule.subject_name: "ПУСТО"}\n`
                        schedule_text += `│ ◿  <i><b>Вчитель</b></i>: ${next_schedule.teacher_name != null? next_schedule.teacher_name: " ПУСТО"}\n`
                        schedule_text += `│ ◿  <i><b>Де</b></i>: ${next_schedule.room_name}\n`;
                        schedule_text += `╰───────`;
                        alt_shedule = true;
                        if (next_schedule.room_name == "Google Classroom") {
                            google_classroom = true;
                        }
                    }
                    schedule_text += "\n";

                    if (google_classroom) {
                        args.reply_markup = {
                            inline_keyboard: [
                                [
                                    {
                                        text: "Посилання на Google Classroom",
                                        url: "https://classroom.google.com"
                                    }
                                ]
                            ]
                        }
                    }

                    bot.sendMessage(user.id, schedule_text, args);
                });

                var groups = db.prepare("SELECT * FROM GroupChat WHERE [group] = ? AND schedule_distribution = 1").all(schedule.group_id);
                groups.map((group) => {
                    var args = {
                        parse_mode: "HTML",
                    }

                    var schedule_text = `У вас розпочалась пара (${schedule.group_name}):\n\n`;
                    schedule_text += `╭─ <b>${schedule.time_id} пара </b>(${schedule.time_start_at} - ${schedule.time_end_at})\n`
                    schedule_text += `│ •  <b>Предмет</b>: ${schedule.subject_name != null? schedule.subject_name: "НІЧОГО"}\n`
                    schedule_text += `│ •  <b>Вчитель</b>: ${schedule.teacher_name != null? schedule.teacher_name: "НІЧОГО"}\n`
                    schedule_text += `│ •  <b>Де</b>: ${schedule.room_name}\n`;
                    schedule_text += `╰───────\n`;
                    
                    if (schedules[shedule_index+1] != undefined && schedules[shedule_index+1].time_start_at == schedule.time_start_at && schedules[shedule_index+1].group_id == schedule.group_id) {
                        var next_schedule = schedules[shedule_index+1];
                        schedule_text += `╭───\n`
                        schedule_text += `│ ◿  <i><b>Предмет</b></i>: ${next_schedule.subject_name != null? next_schedule.subject_name: "НІЧОГО"}\n`
                        schedule_text += `│ ◿  <i><b>Вчитель</b></i>: ${next_schedule.teacher_name != null? next_schedule.teacher_name: " НІЧОГО"}\n`
                        schedule_text += `│ ◿  <i><b>Де</b></i>: ${next_schedule.room_name}\n`;
                        schedule_text += `╰───────`;
                        alt_shedule_group = true;
                    }
                    schedule_text += "\n";

                    if (google_classroom) {
                        args.reply_markup = {
                            inline_keyboard: [
                                [
                                    {
                                        text: "Посилання на Google Classroom",
                                        url: "https://classroom.google.com"
                                    }
                                ]
                            ]
                        }
                    }

                    bot.sendMessage(group.id, schedule_text, args);
                });

                if (alt_shedule || alt_shedule_group) {
                    db.prepare("INSERT INTO Distribution (schedule_id) VALUES (?)").run(schedules[shedule_index+1].id);
                    schedules.splice(shedule_index+1, 1);
                }

                db.prepare("INSERT INTO Distribution (schedule_id) VALUES (?)").run(schedule.id);
            });
        }, 30000);

        setInterval(() => {
            var time_now = new Date().toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric" });
            var time = db.prepare("SELECT * FROM Time WHERE end_at > ?").get(time_now);
            if (time == undefined) {
                db.prepare("DELETE FROM Distribution").run();
            }
        }, 60000);
    },
};