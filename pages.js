const page = require("./page");
const menu = require("./menu");
const bot = require("./telegram").bot;
const link = require("./link");
const db = require("./database").sqlite;
const middleware = require("./middleware");
const env = process.env;

var week_days = [
    "Понеділок",
    "Вівторок",
    "Середа",
    "Четвер",
    "П'ятниця"
    // "Субота",
];

var week_days_schedule = [
    "Понеділок",
    "Вівторок",
    "Середу",
    "Четвер",
    "П'ятницю"
    // "Суботу"
];

function back_button(){
    return {
        text: 'Назад',
        callback_data: link.gen_link(link.to, link.from)
    }
}

function back_button_object(){
    return [
        [
            {
                text: 'Назад',
                callback_data: link.gen_link(link.to, link.from)
            }
        ]
    ]
}


// оцю хуйню треба переробити а то тут дохуя дублікатів
module.exports = {
    init() {
        page.register("menu", (callback) => {
            bot.editMessageText("Що тобі потрібно сталкер?", {
                chat_id: callback.message.chat.id,
                message_id: callback.message.message_id,
                reply_markup: {
                    inline_keyboard: menu.main_menu(callback.message.chat.id)
                }
            });
        });

        page.register("schedule_menu", (callback) => {
            bot.editMessageText("Меню розкладу:\n\n<i>*Бота можна додати до чату та підписати його на розсилку розкладу групи</i>", {
                chat_id: callback.message.chat.id,
                message_id: callback.message.message_id,
                parse_mode: "HTML",
                reply_markup: {
                    inline_keyboard: menu.schedule_menu(callback.message.chat.id)
                }
            });
        });

        page.register("show_schedule", (callback) => {
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

            // 🥴🥴🥴
            while (db.prepare(query).all(group_id, day).length == 0) {
                day++;
                if (day > 5) {
                    day = 1;
                }
            }

            var schedule = db.prepare(query).all(group_id, day);
                

            var schedule_text = "";
            schedule.map((item, index) => {
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
                                text: "Інший день",
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
        });

        page.register("get_day_schedule", (callback) => {
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

        page.register("get_group_schedule", (callback) => {
            var menu_page = Number(link.data[0]);
            var total_pages = 0;

            var group_in_one_page = 9;

            var groups = db.prepare("SELECT * FROM [Group]").all();// ORDER BY name COLLATE NOCASE
            var group_menu = [];
            
            var day = new Date().getDay();
            if (day == 6 || day == 0) {
                day = 1;
            }

            groups.map((group, index) => {
                if (index % group_in_one_page == 0) {
                    total_pages++;
                }

                if (index < menu_page * group_in_one_page || index >= (menu_page + 1) * group_in_one_page){
                    return;
                }

                if (index % 3 == 0) {
                    group_menu.push([]);
                }

                group_menu[group_menu.length - 1].push(
                    {
                        text: group.name,
                        callback_data: link.gen_link(link.to, `show_group_schedule:${group.id}:${day}:${menu_page}`)
                    }
                );
            });

            if (menu_page >= total_pages || menu_page < 0) {
                return;
            }

            group_menu.push([]);

            if (menu_page - 1 < 0) {
                group_menu[group_menu.length - 1].push(
                    {
                        text: ' ',
                        callback_data: link.gen_link(undefined, `${link.to}:${menu_page - 1}`),
                    },
                );
            }else{
                group_menu[group_menu.length - 1].push(
                    {
                        text: '←',
                        callback_data: link.gen_link(undefined, `${link.to}:${menu_page - 1}`),
                    },
                );
            }

            group_menu[group_menu.length - 1].push(
                {
                    text: "Назад",
                    callback_data: link.gen_link(link.to, "schedule_menu")
                }
            );

            if (menu_page + 1 >= total_pages) {
                group_menu[group_menu.length - 1].push(
                    {
                        text: ' ',
                        callback_data: link.gen_link(undefined, `${link.to}:${menu_page + 1}`),
                    },
                );
            }else{
                group_menu[group_menu.length - 1].push(
                    {
                        text: '→',
                        callback_data: link.gen_link(undefined, `${link.to}:${menu_page + 1}`),
                    },
                );
            }

            bot.editMessageText(`Вибери групу [${menu_page+1}/${total_pages}]`, {
                chat_id: callback.message.chat.id,
                message_id: callback.message.message_id,
                reply_markup: {
                    inline_keyboard: group_menu
                }
            });
            
        });


        page.register("show_group_schedule", (callback) => {
            var group_id = link.data[0];
            var day = link.data[1];
            var last_menu_page = link.data[2];
            
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

            // 🥴🥴🥴
            while (db.prepare(query).all(group_id, day).length == 0) {
                day++;
                if (day > 5) {
                    day = 1;
                }
            }

            var schedule = db.prepare(query).all(group_id, day);

            var schedule_text = "";
            schedule.map((item, index) => {
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


            bot.editMessageText(`Розклад на ${week_days_schedule[day-1].toLowerCase()} (${schedule[0].group_name}):\n\n${schedule_text}`, {
                chat_id: callback.message.chat.id,
                message_id: callback.message.message_id,
                parse_mode: "HTML",
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "Інший день",
                                callback_data: link.gen_link(link.to, `get_day_group_schedule:${group_id}:${day}:${last_menu_page}`)
                            },
                            {
                                text: "Назад",
                                callback_data: link.gen_link(link.to, `get_group_schedule:${last_menu_page}`)
                            }
                        ]
                    ]
                }
            });
        });

        page.register("get_day_group_schedule", (callback) => {
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
        });

        page.register("show_bells_schedule", (callback) => {
            var schedule = db.prepare(`SELECT * FROM Time`).all();
            var text = "";

            schedule.map((time, index) => {
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
        });


        page.register("get_group_distribution", (callback) => {
            var menu_page = Number(link.data[0]);
            var total_pages = 0;

            var group_in_one_page = 9;

            var groups = db.prepare("SELECT * FROM [Group]").all();
            var group_menu = [];

            groups.map((group, index) => {
                if (index % group_in_one_page == 0) {
                    total_pages++;
                }

                if (index < menu_page * group_in_one_page || index >= (menu_page + 1) * group_in_one_page){
                    return;
                }

                if (index % 3 == 0) {
                    group_menu.push([]);
                }

                group_menu[group_menu.length - 1].push(
                    {
                        text: group.name,
                        callback_data: link.gen_link(link.to, `subscribe_distribution:${group.id}`)
                    }
                );
            });

            if (menu_page >= total_pages || menu_page < 0) {
                return;
            }

            group_menu.push([]);

            if (menu_page - 1 < 0) {
                group_menu[group_menu.length - 1].push(
                    {
                        text: ' ',
                        callback_data: link.gen_link(undefined, `${link.to}:${menu_page - 1}`),
                    },
                );
            }else{
                group_menu[group_menu.length - 1].push(
                    {
                        text: '←',
                        callback_data: link.gen_link(undefined, `${link.to}:${menu_page - 1}`),
                    },
                );
            }

            group_menu[group_menu.length - 1].push(
                {
                    text: "Назад",
                    callback_data: link.gen_link(link.to, "schedule_menu")
                }
            );

            if (menu_page + 1 >= total_pages) {
                group_menu[group_menu.length - 1].push(
                    {
                        text: ' ',
                        callback_data: link.gen_link(undefined, `${link.to}:${menu_page + 1}`),
                    },
                );
            }else{
                group_menu[group_menu.length - 1].push(
                    {
                        text: '→',
                        callback_data: link.gen_link(undefined, `${link.to}:${menu_page + 1}`),
                    },
                );
            }

            bot.editMessageText(`Вибери групу [${menu_page+1}/${total_pages}]`, {
                chat_id: callback.message.chat.id,
                message_id: callback.message.message_id,
                reply_markup: {
                    inline_keyboard: group_menu
                }
            });
            
        });

        page.register("subscribe_distribution", (callback) => {
            var group_id = link.data[0];
            db.prepare('UPDATE User SET [group] = ?, distribution = 1 WHERE id = ?').run(group_id, callback.from.id);
            var group_name = db.prepare('SELECT name FROM [Group] WHERE id = ?').get(group_id).name;
            bot.editMessageText(`Ти підписався на розсилку (${group_name})`, {
                chat_id: callback.message.chat.id,
                message_id: callback.message.message_id,
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
        });

        page.register("unsubscribe_distribution", (callback) => {
            db.prepare('UPDATE User SET [group] = NULL, distribution = 0 WHERE id = ?').run(callback.from.id);
            bot.editMessageText(`Ти відписався від розсилки`, {
                chat_id: callback.message.chat.id,
                message_id: callback.message.message_id,
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
        });


        page.register("get_group_distribution_gc", async (callback) => {
            var user = await bot.getChatMember(callback.message.chat.id, callback.from.id);
            if (user.status != "administrator" && user.status != "creator" && callback.from.id != env.OWNER_ID) {
                bot.answerCallbackQuery(callback.id, { text: "Ти не адміністратор або автор цього чату!" });
                return;
            }
            var menu_page = Number(link.data[0]);
            var total_pages = 0;

            var group_in_one_page = 9;

            var groups = db.prepare("SELECT * FROM [Group]").all();
            var group_menu = [];

            groups.map((group, index) => {
                if (index % group_in_one_page == 0) {
                    total_pages++;
                }

                if (index < menu_page * group_in_one_page || index >= (menu_page + 1) * group_in_one_page){
                    return;
                }

                if (index % 3 == 0) {
                    group_menu.push([]);
                }

                group_menu[group_menu.length - 1].push(
                    {
                        text: group.name,
                        callback_data: link.gen_link(link.to, `subscribe_distribution_gc:${group.id}`)
                    }
                );
            });

            if (menu_page >= total_pages || menu_page < 0) {
                return;
            }

            group_menu.push([]);

            if (menu_page - 1 < 0) {
                group_menu[group_menu.length - 1].push(
                    {
                        text: ' ',
                        callback_data: link.gen_link(undefined, `${link.to}:${menu_page - 1}`),
                    },
                );
            }else{
                group_menu[group_menu.length - 1].push(
                    {
                        text: '←',
                        callback_data: link.gen_link(undefined, `${link.to}:${menu_page - 1}`),
                    },
                );
            }


            if (menu_page + 1 >= total_pages) {
                group_menu[group_menu.length - 1].push(
                    {
                        text: ' ',
                        callback_data: link.gen_link(undefined, `${link.to}:${menu_page + 1}`),
                    },
                );
            }else{
                group_menu[group_menu.length - 1].push(
                    {
                        text: '→',
                        callback_data: link.gen_link(undefined, `${link.to}:${menu_page + 1}`),
                    },
                );
            }

            bot.editMessageText(`Вибери групу [${menu_page+1}/${total_pages}]`, {
                chat_id: callback.message.chat.id,
                message_id: callback.message.message_id,
                reply_markup: {
                    inline_keyboard: group_menu
                }
            });
            
        });

        page.register("subscribe_distribution_gc", async (callback) => {
            var user = await bot.getChatMember(callback.message.chat.id, callback.from.id);
            if (user.status != "administrator" && user.status != "creator" && callback.from.id != env.OWNER_ID) {
                bot.answerCallbackQuery(callback.id, { text: "Ти не адміністратор групи." });
                return;
            }
            var group_id = link.data[0];
            var chat_id = callback.message.chat.id;
            db.prepare('UPDATE GroupChat SET [group] = ?, schedule_distribution = 1 WHERE id = ?').run(group_id, chat_id);
            var username = callback.from.username? `@${callback.from.username}` : callback.from.first_name? callback.from.first_name : callback.from.last_name;
            var group_name = db.prepare('SELECT name FROM [Group] WHERE id = ?').get(group_id).name;
            bot.editMessageText(`${username} підписав групу на розсилку (${group_name})`, {
                chat_id: callback.message.chat.id,
                message_id: callback.message.message_id,
            });
        });


        page.register("ss_menu", (callback) => {
            bot.editMessageText("Ну що сталкер, вибирай.", {
                chat_id: callback.message.chat.id,
                message_id: callback.message.message_id,
                reply_markup: {
                    inline_keyboard: menu.ss_menu()
                }
            });
        });

        page.register("ss_about", (callback) => {
            const text = require("./ss_about_text.json");
            bot.editMessageText(text, {
                chat_id: callback.message.chat.id,
                message_id: callback.message.message_id,
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "Назад",
                                callback_data: link.gen_link(link.to, link.from)
                            }
                        ]
                    ]
                }
            });
        });

        page.register("complaint_menu", (callback) => {
            bot.editMessageText("Вибери тип скарги.", {
                chat_id: callback.message.chat.id,
                message_id: callback.message.message_id,
                reply_markup: {
                    inline_keyboard: menu.complaint_menu()
                }
            });
        });

        page.register("complaint_teacher_menu", (callback) => {
            var menu_page = Number(link.data[0]);
            var total_pages = 0;

            var teachers_in_one_page = 8;

            var teachers = db.prepare("SELECT * FROM Teacher ORDER BY name COLLATE NOCASE").all();
            // delete first element (id = 0)
            teachers.shift();
            var teacher_menu = [];

            teachers.map((teacher, index) => {
                if (index % teachers_in_one_page == 0) {
                    total_pages++;
                }

                if (index < menu_page * teachers_in_one_page || index >= (menu_page + 1) * teachers_in_one_page){
                    return;
                }

                if (index % 2 == 0) {
                    teacher_menu.push([]);
                }

                teacher_menu[teacher_menu.length - 1].push(
                    {
                        text: teacher.name,
                        callback_data: link.gen_link(link.to, `complaint_teacher_text:${teacher.id}:${menu_page}`)
                    }
                );
            });

            if (menu_page >= total_pages || menu_page < 0) {
                return;
            }

            teacher_menu.push([]);

            if (menu_page - 1 < 0) {
                teacher_menu[teacher_menu.length - 1].push(
                    {
                        text: ' ',
                        callback_data: link.gen_link(undefined, `${link.to}:${menu_page - 1}`),
                    },
                );
            }else{
                teacher_menu[teacher_menu.length - 1].push(
                    {
                        text: '←',
                        callback_data: link.gen_link(undefined, `${link.to}:${menu_page - 1}`),
                    },
                );
            }

            teacher_menu[teacher_menu.length - 1].push(
                {
                    text: "Назад",
                    callback_data: link.gen_link(link.to, "complaint_menu")
                }
            );

            if (menu_page + 1 >= total_pages) {
                teacher_menu[teacher_menu.length - 1].push(
                    {
                        text: ' ',
                        callback_data: link.gen_link(undefined, `${link.to}:${menu_page + 1}`),
                    },
                );
            }else{
                teacher_menu[teacher_menu.length - 1].push(
                    {
                        text: '→',
                        callback_data: link.gen_link(undefined, `${link.to}:${menu_page + 1}`),
                    },
                );
            }

            bot.editMessageText(`Вибери викладача [${menu_page+1}/${total_pages}]`, {
                chat_id: callback.message.chat.id,
                message_id: callback.message.message_id,
                reply_markup: {
                    inline_keyboard: teacher_menu
                }
            }); 
        });

        page.register("offer_text", (callback) => {
            if (middleware.has_block(link.to, callback.message.chat.id, 10)){
                bot.editMessageText("Ти можеш відправити лише одну пропозицію у 10 хвилин.", {
                    chat_id: callback.message.chat.id,
                    message_id: callback.message.message_id,
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "Назад",
                                    callback_data: link.gen_link(link.to, link.from)
                                }
                            ]
                        ]
                    }
                });
                return;
            }

            bot.editMessageText("Що в тебе є сталкер?\n\n<i>відправляй декілька пропозицій одним текстом</i>", {
                chat_id: callback.message.chat.id,
                message_id: callback.message.message_id,
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "Назад",
                                callback_data: link.gen_link(link.to, link.from)
                            }
                        ]
                    ]
                },
                parse_mode: "HTML"
            }).then(() => {
                db.prepare("UPDATE User SET type = ? WHERE id = ?").run(callback.data, callback.message.chat.id);
            });       
        });

        page.register("request_to_join_ss_text", (callback) => {
            if (middleware.has_block(link.to, callback.message.chat.id, 30)){
                bot.editMessageText("Ти можеш відправити лише один запит на вступ у 30 хвилин.", {
                    chat_id: callback.message.chat.id,
                    message_id: callback.message.message_id,
                    reply_markup: {
                        inline_keyboard:[
                            [
                                {
                                    text: "Назад",
                                    callback_data: link.gen_link(link.to, link.from)
                                }
                            ]
                        ]
                    }
                });
                return;
            }
            bot.editMessageText(`Добре, надішли мені: \n1. ПІБ.\n2. Групу\n3. Твій <b>"DiscordTag"</b>\n\n<i>писати як список не обов'язково</i>`, {
                chat_id: callback.message.chat.id,
                message_id: callback.message.message_id,
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "Назад",
                                callback_data: link.gen_link(link.to, link.from)
                            }
                        ]
                    ]
                },
                parse_mode: "HTML"
            }).then(() => {
                db.prepare("UPDATE User SET type = ? WHERE id = ?").run(callback.data, callback.message.chat.id);
            });
        });

        page.register("complaint_ss_text", (callback) => {
            if (middleware.has_block(link.to, callback.message.chat.id, 10)){
                bot.editMessageText("Ти можеш відправити лише одну скаргу у 10 хвилин.", {
                    chat_id: callback.message.chat.id,
                    message_id: callback.message.message_id,
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "Назад",
                                    callback_data: link.gen_link(link.to, link.from)
                                }
                            ]
                        ]
                    }
                });
                return;
            }
            bot.editMessageText("Добре, надішли мені скаргу.", {
                chat_id: callback.message.chat.id,
                message_id: callback.message.message_id,
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "Назад",
                                callback_data: link.gen_link(link.to, link.from)
                            }
                        ]
                    ]
                }
            }).then(() => {
                db.prepare("UPDATE User SET type = ? WHERE id = ?").run(callback.data, callback.message.chat.id);
            });
        });


        page.register("complaint_bot_text", (callback) => {
            if (middleware.has_block(link.to, callback.message.chat.id, 10)){
                bot.editMessageText("Ти можеш відправити лише одну скаргу у 10 хвилин.", {
                    chat_id: callback.message.chat.id,
                    message_id: callback.message.message_id,
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "Назад",
                                    callback_data: link.gen_link(link.to, link.from)
                                }
                            ]
                        ]
                    }
                });
                return;
            }
            bot.editMessageText("Надішли мені скаргу.\nЗ тобою зв'яжуться якщо будуть потрібні деталі що до помилки.", {
                chat_id: callback.message.chat.id,
                message_id: callback.message.message_id,
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "Назад",
                                callback_data: link.gen_link(link.to, link.from)
                            }
                        ]
                    ]
                }
            }).then(() => {
                db.prepare("UPDATE User SET type = ? WHERE id = ?").run(callback.data, callback.message.chat.id);
            });
        });

        page.register("complaint_teacher_text", (callback) => {
            if (middleware.has_block(link.to, callback.message.chat.id, 10)){
                bot.editMessageText("Ти можеш відправити лише одну скаргу у 10 хвилин.", {
                    chat_id: callback.message.chat.id,
                    message_id: callback.message.message_id,
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "Назад",
                                    callback_data: link.gen_link(link.to, `${link.from}:${link.data[1]}`)
                                }
                            ]
                        ]
                    }
                });
                return;
            }

            var teacher = db.prepare("SELECT name FROM Teacher WHERE id = ?").get(link.data[0]).name;
            bot.editMessageText(`Добре, надішли мені скаргу на ${teacher}`, {
                chat_id: callback.message.chat.id,
                message_id: callback.message.message_id,
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "Назад",
                                callback_data: link.gen_link(link.to, `${link.from}:${link.data[1]}`)
                            }
                        ]
                    ]
                }
            }).then(() => {
                db.prepare("UPDATE User SET type = ? WHERE id = ?").run(callback.data, callback.message.chat.id);
            });
        });
    }
}