const db = require("./database").sqlite;
const bot = require("./telegram").bot;
const bridges = require("./bridges");
const fs = require("fs");
const narnia = require("./narnia");
const gram = require("./gram");

module.exports = {
    init() {
        const date = new Date();
        var time = String(date.getHours()).padStart(2, '0') + ":" + String(date.getMinutes()).padStart(2, '0');
        setInterval(async () => {
            return;
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
                    schedule_text += `│ •  <b>Де</b>: ${schedule.room_name != null? schedule.room_name: " Пусто"}\n`;
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
            // перевірити, чи немає у користувача неіснуючої групи
            var users = db.prepare(`
                SELECT User.id, User.[group], User.distribution 
                FROM User LEFT JOIN [Group] ON User.[group] = [Group].id WHERE [Group].id IS NOT User.[group]
            `).all();
            users.forEach((user) => {
                db.prepare("UPDATE User SET distribution = 0, [group] = NULL WHERE id = ?").run(user.id);
            });

            // перевірити, чи немає неіснуючої групи
            var groups = db.prepare(`
                SELECT GroupChat.id, GroupChat.[group], GroupChat.schedule_distribution 
                FROM GroupChat LEFT JOIN [Group] ON GroupChat.[group] = [Group].id WHERE [Group].id IS NOT GroupChat.[group]
            `).all();
            groups.forEach((group) => {
                db.prepare("UPDATE GroupChat SET schedule_distribution = 0, [group] = NULL WHERE id = ?").run(group.id);
            });

            // перевіряємо термін дії посилань, якщо прострочені видаляємо з БД
            var links = db.prepare("SELECT * FROM Link WHERE expired_at < ?").all(new Date().getTime());
            links.forEach((link) => {
                db.prepare("DELETE FROM Link WHERE id = ?").run(link.id);
            });
        }, 120_000);

        setInterval(() => {
            // some code
            let ss_members = db.prepare("SELECT id, ss_groups FROM User WHERE is_ss = 1").all();

            narnia.ss_chats.forEach(async chat_key => {
                const data = await gram.get_participants(narnia.get_value(chat_key));
                if (!data)
                    // break kinda
                    return;

                const users = data.users.filter(user => !user.bot);
                const users_id = users.map(user => {
                    return user.id.toJSNumber();
                });

                const participants = data.participants.filter(participant => users_id.includes(participant.userId.toJSNumber()));
                const real_members_id = participants.map(participant => {
                    return participant.userId.toJSNumber();
                });


                if (chat_key == "ss_main_chat_id") {
                    const db_members_id = ss_members.map(e => {return e.id});

                    users.forEach(user => {
                        if(!real_members_id.includes(user.id.toJSNumber()))
                            return;
                        db.prepare("INSERT OR IGNORE INTO User (id) VALUES (?)").run(user.id.toJSNumber());
                        db.prepare("UPDATE User SET username = ?, first_name = ?, last_name = ? WHERE id = ?")
                        .run(user.username, user.firstName, user.lastName, user.id.toJSNumber());
                    });

                    ss_members = db.prepare("SELECT id, ss_groups FROM User WHERE is_ss = 1").all();

                    const tumbochka_id = narnia.get_value("ss_tumbochka_channel_id");

                    const tumbochka_data = await gram.get_participants(tumbochka_id);


                    const tumbochka_users = tumbochka_data.users.filter(user => !user.bot);
                    const tumbochka_users_id = tumbochka_users.map(user => {
                        return user.id.toJSNumber();
                    });

                    const tumbochka_participants = tumbochka_data.participants.filter(participant => tumbochka_users_id.includes(participant.userId.toJSNumber()));
                    const tumbochka_members_id = tumbochka_participants.map(participant => {
                        return participant.userId.toJSNumber();
                    });

                    const unset_is_ss = db_members_id.filter(id => !real_members_id.includes(id));
                    const set_is_ss = real_members_id.filter(id => !db_members_id.includes(id));

                    const kick_from_tumbochka = unset_is_ss.filter(async id => await tumbochka_members_id.includes(id));

                    unset_is_ss.forEach(id => {
                        db.prepare("UPDATE User SET is_ss = 0 WHERE id = ?").run(id);
                    });

                    kick_from_tumbochka.forEach(id => {
                        try {
                            bot.banChatMember(tumbochka_id, id);
                        } catch(e) {
                            console.error(e);
                        }
                    });

                    set_is_ss.forEach(id => {
                        db.prepare("UPDATE User SET is_ss = 1 WHERE id = ?").run(id);
                    });

                    return;
                }

                const no_group = ss_members.filter(({ss_groups}) => !JSON.parse(ss_groups).includes(chat_key));
                const add_group = no_group.filter(({id}) => real_members_id.includes(id));

                const have_group = ss_members.filter(({ss_groups}) => JSON.parse(ss_groups).includes(chat_key));
                const remove_group = have_group.filter(({id}) => !real_members_id.includes(id));

                add_group.forEach(({id, ss_groups}) => {
                    let parsed = JSON.parse(ss_groups);

                    parsed.push(chat_key);

                    db.prepare("UPDATE User SET ss_groups = ? WHERE id = ?").run(JSON.stringify(parsed), id);
                });

                remove_group.forEach(({id, ss_groups}) => {
                    const parsed = JSON.parse(ss_groups).filter(e => e != chat_key);

                    db.prepare("UPDATE User SET ss_groups = ? WHERE id = ?").run(JSON.stringify(parsed), id);
                });
            });
        }, 12_000);
    },
};