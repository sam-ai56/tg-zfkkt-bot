const db = require("./database").sqlite;
const bot = require("./telegram").bot;
const bridges = require("./bridges");
const axios = require("axios");
const fs = require("fs");

module.exports = {
    init() {
        const date = new Date();
        var time = String(date.getHours()).padStart(2, '0') + ":" + String(date.getMinutes()).padStart(2, '0');
        setInterval(async () => {
            const bridge = await bridges.get();
            if(!bridge)
                return;

            if (bridge.is_alert)
                return;

            const date = new Date();
            var day = date.getDay();
            var time = String(date.getHours()).padStart(2, '0') + ":" + String(date.getMinutes()).padStart(2, '0');
            var schedules = db.prepare(`
                SELECT Schedule.id, Schedule.day, Schedule.group_id, Schedule.time_id, Time.start_at as time_start_at, Time.end_at as time_end_at, Subject.name AS subject_name, Subject.id AS subject_id, [Group].name AS group_name, Teacher.name AS teacher_name, Room.name AS room_name
                FROM Schedule
                INNER JOIN Subject ON Schedule.subject_id = Subject.id
                INNER JOIN [Group] ON Schedule.group_id = [Group].id
                INNER JOIN Teacher ON Schedule.teacher_id = Teacher.id
                INNER JOIN Room ON Schedule.room_id = Room.id
                INNER JOIN Time ON Schedule.time_id = Time.id
                WHERE time_start_at <= ? AND time_end_at >= ? AND Schedule.day = ?;
            `).all(time, time, day);

            schedules.forEach((schedule, shedule_index) => {
                // if (schedule.subject_id == 117) {
                //     return;
                // }
                var schedule_distribution = db.prepare("SELECT * FROM Distribution WHERE schedule_id = ?").get(schedule.id);
                var alt_shedule = false;
                var alt_shedule_group = false;
                var google_classroom = false;
                if (schedule_distribution)
                    return;

                var users = db.prepare("SELECT * FROM User WHERE [group] = ? AND distribution = 1").all(schedule.group_id);
                users.forEach((user) => {
                    var args = {
                        parse_mode: "HTML",
                    }

                    var chat = bot.getChat(user.id);
                    var name = chat.first_name;
                    if (chat.last_name != undefined) {
                        name += "" + chat.last_name;
                    }


                    var schedule_text = "";
                    schedule_text += `╭─ <b>${schedule.time_id} пара </b>(${schedule.time_start_at} - ${schedule.time_end_at})\n`
                    schedule_text += `│ •  <b>Предмет</b>: ${schedule.subject_name != null? schedule.subject_name: "Пусто"}\n`

                    var teacher_name = schedule.teacher_name;
                    if (teacher_name != null) {
                        var teacher_name_arr = teacher_name.split(" ");
                        var teacher_last_name = teacher_name_arr[1];
                        var teacher_second_name = teacher_name_arr[2];
                        teacher_name = teacher_name_arr[0] + " " + teacher_last_name[0] + ". " + teacher_second_name[0] + ".";
                    }

                    schedule_text += `│ •  <b>Вчитель</b>: ${schedule.teacher_name != null? teacher_name: " Пусто"}\n`
                    schedule_text += `│ •  <b>Де</b>: ${schedule.room_name != null? schedule.room_name: " Пусто"}\n`;
                    schedule_text += `╰───────\n`;

                    if (schedule.room_name == "Google Classroom") {
                        google_classroom = true;
                    }

                    if (schedules[shedule_index+1] != undefined && schedules[shedule_index+1].time_start_at == schedule.time_start_at && schedules[shedule_index+1].group_id == schedule.group_id) {
                        var next_schedule = schedules[shedule_index+1];
                        schedule_text += `╭───\n`
                        schedule_text += `│ ◿  <i><b>Предмет</b></i>: ${next_schedule.subject_name != null? next_schedule.subject_name: "Пусто"}\n`

                        var teacher_name = next_schedule.teacher_name;
                        if (teacher_name != null) {
                            var teacher_name_arr = teacher_name.split(" ");
                            var teacher_last_name = teacher_name_arr[1];
                            var teacher_second_name = teacher_name_arr[2];
                            teacher_name = teacher_name_arr[0] + " " + teacher_last_name[0] + ". " + teacher_second_name[0] + ".";
                        }

                        schedule_text += `│ ◿  <i><b>Вчитель</b></i>: ${next_schedule.teacher_name != null? teacher_name: " Пусто"}\n`
                        schedule_text += `│ ◿  <i><b>Де</b></i>: ${next_schedule.room_name != null? next_schedule.room_name: " Пусто"}\n`;
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

                    bot.sendMessage(user.id, schedule_text, args).catch({});
                });

                var groups = db.prepare("SELECT * FROM GroupChat WHERE [group] = ? AND schedule_distribution = 1").all(schedule.group_id);
                groups.forEach((group) => {
                    var args = {
                        parse_mode: "HTML",
                    }

                    var schedule_text = "";
                    schedule_text += `╭─ <b>${schedule.time_id} пара </b>(${schedule.time_start_at} - ${schedule.time_end_at})\n`
                    schedule_text += `│ •  <b>Предмет</b>: ${schedule.subject_name != null? schedule.subject_name: "Пусто"}\n`


                    var teacher_name = schedule.teacher_name;
                    if (teacher_name != null) {
                        var teacher_name_arr = teacher_name.split(" ");
                        var teacher_last_name = teacher_name_arr[1];
                        var teacher_second_name = teacher_name_arr[2];
                        teacher_name = teacher_name_arr[0] + " " + teacher_last_name[0] + ". " + teacher_second_name[0] + ".";
                    }


                    schedule_text += `│ •  <b>Вчитель</b>: ${schedule.teacher_name != null? teacher_name: "Пусто"}\n`
                    schedule_text += `│ •  <b>Де</b>: ${schedule.room_name}\n`;
                    schedule_text += `╰───────\n`;

                    if (schedules[shedule_index+1] != undefined && schedules[shedule_index+1].time_start_at == schedule.time_start_at && schedules[shedule_index+1].group_id == schedule.group_id) {
                        var next_schedule = schedules[shedule_index+1];
                        schedule_text += `╭───\n`
                        schedule_text += `│ ◿  <i><b>Предмет</b></i>: ${next_schedule.subject_name != null? next_schedule.subject_name: "Пусто"}\n`


                        var teacher_name = next_schedule.teacher_name;
                        if (teacher_name != null) {
                            var teacher_name_arr = teacher_name.split(" ");
                            var teacher_last_name = teacher_name_arr[1];
                            var teacher_second_name = teacher_name_arr[2];
                            teacher_name = teacher_name_arr[0] + " " + teacher_last_name[0] + ". " + teacher_second_name[0] + ".";
                        }


                        schedule_text += `│ ◿  <i><b>Вчитель</b></i>: ${next_schedule.teacher_name != null? teacher_name: " Пусто"}\n`
                        schedule_text += `│ ◿  <i><b>Де</b></i>: ${next_schedule.room_name != null? next_schedule.room_name: " Пусто"}\n`;
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

                    bot.sendMessage(group.id, schedule_text, args).catch({});
                });

                if (alt_shedule || alt_shedule_group) {
                    db.prepare("INSERT INTO Distribution (type, schedule_id) VALUES ('schedule',?)").run(schedules[shedule_index+1].id);
                    schedules.splice(shedule_index+1, 1);
                }

                db.prepare("INSERT INTO Distribution (type, schedule_id) VALUES ('schedule', ?)").run(schedule.id);
            });
        }, 30_000);

        setInterval(async () => {
            return;
            var day = new Date().getDay();

            if (day == 0 || day == 6) {
                return;
            }

            const bridge = await bridges.get();
            if (bridge.is_alert) {
                var alert_distribution = db.prepare("SELECT * FROM Distribution WHERE type = 'alert_off'").get();
                if (!alert_distribution) {
                    return;
                }

                const date = new Date();
                var time_now = String(date.getHours()).padStart(2, '0') + ":" + String(date.getMinutes()).padStart(2, '0');
                var time = db.prepare("SELECT * FROM Time WHERE start_at <= ? AND end_at >= ?").get(time_now, time_now);
                if (time == undefined) {
                    return;
                }

                const text = `🔴 Запорізька область – повітряна тривога!`;

                var users = db.prepare("SELECT * FROM User WHERE distribution = 1").all();
                users.forEach((user) => {
                    bot.sendMessage(user.id, text).catch({});
                });

                var groups = db.prepare("SELECT * FROM GroupChat WHERE schedule_distribution = 1").all();
                groups.forEach((group) => {
                    bot.sendMessage(group.id, text).catch({});
                });

                db.prepare("UPDATE Distribution SET type = 'alert_on' WHERE type = 'alert_off'").run()
                return;
            }

            var alert_distribution = db.prepare("SELECT * FROM Distribution WHERE type = 'alert_on'").get();
            if (!alert_distribution) {
                return;
            }

            const date = new Date();
            var time_now = String(date.getHours()).padStart(2, '0') + ":" + String(date.getMinutes()).padStart(2, '0');
            var time = db.prepare("SELECT * FROM Time WHERE start_at <= ? AND end_at >= ?").get(time_now, time_now);
            if (time == undefined) {
                return;
            }

            const text = `🟢 Запорізька область - відбій тривоги.`;

            var users = db.prepare("SELECT * FROM User WHERE distribution = 1").all();
            users.forEach((user) => {
                bot.sendMessage(user.id, text).catch({});
            });

            var groups = db.prepare("SELECT * FROM GroupChat WHERE schedule_distribution = 1").all();
            groups.forEach((group) => {
                bot.sendMessage(group.id, text).catch({});
            });

            db.prepare("UPDATE Distribution SET type = 'alert_off' WHERE type = 'alert_on'").run();
        }, 10_000);

        setInterval(async () => {
            var time_now = new Date().toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric" });
            var time = db.prepare("SELECT * FROM Time WHERE end_at > ?").get(time_now);
            if (time == undefined) {
                db.prepare("DELETE FROM Distribution WHERE type = 'schedule'").run();
                db.prepare("UPDATE Distribution SET type = 'alert_off' WHERE type = 'alert_on'").run();
            }
        }, 60_000);

        setInterval(() => {
            // check if user have non existed group
            var users = db.prepare(`
                SELECT User.id, User.[group], User.distribution 
                FROM User LEFT JOIN [Group] ON User.[group] = [Group].id WHERE [Group].id IS NOT User.[group]
            `).all();
            users.forEach((user) => {
                db.prepare("UPDATE User SET distribution = 0, [group] = NULL WHERE id = ?").run(user.id);
            });

            // check if group have non existed group
            var groups = db.prepare(`
                SELECT GroupChat.id, GroupChat.[group], GroupChat.schedule_distribution 
                FROM GroupChat LEFT JOIN [Group] ON GroupChat.[group] = [Group].id WHERE [Group].id IS NOT GroupChat.[group]
            `).all();
            groups.forEach((group) => {
                db.prepare("UPDATE GroupChat SET schedule_distribution = 0, [group] = NULL WHERE id = ?").run(group.id);
            });

            // check links expiration if expired delete from db
            var links = db.prepare("SELECT * FROM Link WHERE expired_at < ?").all(new Date().getTime());
            links.forEach((link) => {
                db.prepare("DELETE FROM Link WHERE id = ?").run(link.id);
            });
        }, 120_000);
    },
};