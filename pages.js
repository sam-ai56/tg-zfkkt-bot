const page = require("./page");
const menu = require("./menu");
const bot = require("./telegram").bot;
const link = require("./link");
const db = require("./database").sqlite;
const middleware = require("./middleware");

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

module.exports = {
    parse_data() {

    },
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

        page.register("owner_menu", (callback) => {
            bot.editMessageText("Willkommen in NARNIA!", {
                chat_id: callback.message.chat.id,
                message_id: callback.message.message_id,
                reply_markup: {
                    inline_keyboard: menu.owner_menu()
                }
            });
        });

        page.register("create_admin_code", (callback) => {
            var time = new Date().getTime();
            var random1 = Math.random() * (time);
            var random2 = Math.random() * (time);
            var code = random1.toString(36).substring(2, 15) + random2.toString(36).substring(2, 15);
            
            bot.editMessageText(`Код для запрошення адміна:\n<b>"${code}"</b>`, {
                chat_id: callback.message.chat.id,
                message_id: callback.message.message_id,
                reply_markup: {
                    inline_keyboard: back_button_object()
                },
                parse_mode: "HTML"
            }).then(() => {
                db.prepare('INSERT INTO InviteCode (code, type, created_at) VALUES (?, ?, ?)').run(code, "admin", time);
            });
        });

        page.register("confirm_admin_menu", (callback) => {
            var codes = db.prepare('SELECT * FROM InviteCode WHERE type = ?').all("admin");
            console.log(codes);
            var codes_menu = [];
            codes.map((code) => {
                if(code.user_id == null){
                    return;
                }
                const user = db.prepare('SELECT * FROM User WHERE id = ?').get(code.user_id);
                codes_menu.push([
                    {
                        text: `${user.first_name} ${user.last_name? user.last_name : ""} ${user.username? "(@" + user.username + ")" : ""}`,
                        callback_data: link.gen_link(link.to, `confirm_admin_alert:${code.user_id}`)
                    }
                ]);
            });

            codes_menu.push([
                {
                    text: "Назад",
                    callback_data: link.gen_link(link.to, "owner_menu")
                }
            ]);

            bot.editMessageText("Майбутні адміни:", {
                chat_id: callback.message.chat.id,
                message_id: callback.message.message_id,
                reply_markup: {
                    inline_keyboard: codes_menu
                }
            });
        });

        page.register("confirm_admin_alert", (callback) => {
            var user = db.prepare("SELECT * FROM User WHERE id = ?").get(link.data[0]);

            bot.editMessageText(`${user.first_name} ${user.last_name? user.last_name : ""} ${user.username? "(@" + user.username + ")" : ""} хоче стати адміном.`, {
                chat_id: callback.message.chat.id,
                message_id: callback.message.message_id,
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "Підтвердити",
                                callback_data: link.gen_link(link.to, `confirmed_admin:${link.data[0]}`)
                            },
                            {
                                text: "Відхилити",
                                callback_data: link.gen_link(link.to, `rejected_admin:${link.data[0]}`)
                            }
                        ],
                        [
                            back_button()
                        ]
                    ]
                }
            });
        });

        page.register("confirmed_admin", (callback) => {
            var user = db.prepare("SELECT * FROM User WHERE id = ?").get(link.data[0]);
            db.prepare("DELETE FROM InviteCode WHERE user_id = ?").run(link.data[0]);
            db.prepare("UPDATE User SET is_admin = 1 WHERE id = ?").run(link.data[0]);
            bot.editMessageText(`Запит ${user.first_name} ${user.last_name? user.last_name : ""} ${user.username? "(@" + user.username + ")" : ""} було підтверджено`, {
                chat_id: callback.message.chat.id,
                message_id: callback.message.message_id,
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "Назад",
                                callback_data: link.gen_link(link.to, "confirm_admin_menu")
                            }
                        ]
                    ]
                }
            });
            bot.sendMessage(link.data[0], "Ваш запит було підтверджено. Тепер ви адмін!");
        });

        page.register("rejected_admin", (callback) => {
            var user = db.prepare("SELECT * FROM User WHERE id = ?").get(link.data[0]);
            db.prepare("DELETE FROM InviteCode WHERE user_id = ?").run(link.data[0]);
            bot.editMessageText(`Запит ${user.first_name} ${user.last_name? user.last_name : ""} ${user.username? "(@" + user.username + ")" : ""} було скасовано.`, {
                chat_id: callback.message.chat.id,
                message_id: callback.message.message_id,
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "Назад",
                                callback_data: link.gen_link(link.to, "confirm_admin_menu")
                            }
                        ]
                    ]
                }
            });
        });
        
        page.register("list_admins", (callback) => {
            var admins = db.prepare("SELECT * FROM User WHERE is_admin = 1").all();
            var admins_menu = [];

            admins.map((admin) => {
                admins_menu.push([
                    {
                        text: `${admin.first_name} ${admin.last_name? admin.last_name : ""} ${admin.username? "(@" + admin.username + ")" : ""}`,
                        callback_data: link.gen_link(link.to, `admin_options:${admin.id}`)
                    }
                ]);
            });

            admins_menu.push([
                {
                    text: "Назад",
                    callback_data: link.gen_link(link.to, "owner_menu")
                }
            ]);

            bot.editMessageText("Адміни:", {
                chat_id: callback.message.chat.id,
                message_id: callback.message.message_id,
                reply_markup: {
                    inline_keyboard: admins_menu
                }
            });
        });


        page.register("admin_options", (callback) => {
            var user = db.prepare("SELECT * FROM User WHERE id = ?").get(link.data[0]);

            bot.editMessageText(`${user.first_name} ${user.last_name? user.last_name : ""} ${user.username? "(@" + user.username + ")" : ""}`, {
                chat_id: callback.message.chat.id,
                message_id: callback.message.message_id,
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "Видалити",
                                callback_data: link.gen_link(link.to, `delete_admin:${link.data[0]}`)
                            }
                        ],
                        [
                            back_button()
                        ]
                    ]
                }
            });
        });

        page.register("delete_admin", (callback) => {
            var user = db.prepare("SELECT * FROM User WHERE id = ?").get(link.data[0]);
            db.prepare("UPDATE User SET last_name = null, first_name = null, username = null, is_admin = 0 WHERE id = ?").run(link.data[0]);
            bot.editMessageText(`Запит ${user.first_name} ${user.last_name? user.last_name : ""} ${user.username? "(@" + user.username + ")" : ""} було видалено.`, {
                chat_id: callback.message.chat.id,
                message_id: callback.message.message_id,
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "Назад",
                                callback_data: link.gen_link(link.to, "list_admins")
                            }
                        ]
                    ]
                }
            });
            bot.sendMessage(link.data[0], "Вас видалено з адмінів. xD");
        });

        page.register("rejected_admin", (callback) => {
            var user = db.prepare("SELECT * FROM User WHERE id = ?").get(link.data[0]);
            db.prepare("DELETE FROM InviteCode WHERE user_id = ?").run(link.data[0]);
            bot.editMessageText(`Запит ${user.first_name} ${user.last_name? user.last_name : ""} ${user.username? "(@" + user.username + ")" : ""} було скасовано.`, {
                chat_id: callback.message.chat.id,
                message_id: callback.message.message_id,
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "Назад",
                                callback_data: link.gen_link(link.to, "confirm_admin_menu")
                            }
                        ]
                    ]
                }
            });
        });


        page.register("admin_menu", (callback) => {
            bot.editMessageText("Адмін меню", {
                chat_id: callback.message.chat.id,
                message_id: callback.message.message_id,
                reply_markup: {
                    inline_keyboard: menu.admin_menu()
                }
            });
        });

        page.register("schedule_menu", (callback) => {
            bot.editMessageText("Що тобі сталкер?", {
                chat_id: callback.message.chat.id,
                message_id: callback.message.message_id,
                reply_markup: {
                    inline_keyboard: menu.schedule_menu()
                }
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
            bot.editMessageText(`Добре, надішли мені: \n1. ПІБ.\n2. Группу\n3. Твій дискорд <b>"DiscordTag"</b>\n\n<i>писати як список не обов'язково</i>`, {
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