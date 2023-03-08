const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();
const env = process.env;

const menu = require("./menu");

const database = require("./database");
const db = database.sqlite;
database.init();

const bot = new TelegramBot(env.BOT_TOKEN, {polling: true});

function success_message(chat_id, text) {
    bot.sendMessage(chat_id, text, {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: 'У меню',
                        callback_data: menu.link('success_message', 'menu')
                    }
                ]
            ]
        }
    });
}

function send_message_to_group(title, text) {
    bot.getChat(env.GROUP_ID).then((chat) => {
        bot.sendMessage(chat.id, `<b>${title}</b>\n<em>${text}</em>`, {parse_mode: "HTML"});
    });
}

// time in minutes
function has_block(type, chat_id, time) {
    var date = new Date();
    var row = db.prepare("SELECT time FROM BlockList WHERE id = ? AND type = ?").get(chat_id, type);
    if (row != undefined) { 
        if (date.getTime() - row.time < time * 60000) {
            return true;
        }
        db.prepare("DELETE FROM BlockList WHERE id = ? AND type = ?").run(chat_id, type);
    }
    return false;
}

bot.getMe().then((_bot) => {
    console.log(_bot.first_name + " is running...");
});

bot.on('callback_query', (callback) => {
    if (env.MAINTENANCE == "true" && callback.from.id != env.ADMIN_ID) {
        bot.answerCallbackQuery(callback.id, {
            text: "Бот на технічному обслуговуванні. Спробуйте пізніше.",
            show_alert: true
          });
        return;
    }

    const chat_id = callback.message.chat.id;
    var result = db.prepare("SELECT * FROM User WHERE id = ?").get(callback.from.id);

    if (result == undefined) {
        bot.sendMessage(chat_id, "Будь ласка, перезапустіть бота за допомогою команди /start. Або створіть нове меню /menu.");
        return;
    }

    var callback_data = callback.data;
    var data = callback_data.split(":");

    var from_link = data[0];
    var to_link = data[1];

    console.log(callback_data)

    switch (to_link) {
        case 'menu':
            bot.editMessageText("Що тобі потрібно сталкер?", {
                chat_id: chat_id,
                message_id: callback.message.message_id,
                reply_markup: {
                    inline_keyboard: menu.main_menu
                }
            });
            break;
        case 'ss_menu':
            bot.editMessageText("Ну що сталкер, вибирай.", {
                chat_id: chat_id,
                message_id: callback.message.message_id,
                reply_markup: {
                    inline_keyboard: menu.ss_menu(to_link)
                }
            });
            break;
        case 'complaint_menu':
            bot.editMessageText("Вибери тип скарги.", {
                chat_id: chat_id,
                message_id: callback.message.message_id,
                reply_markup: {
                    inline_keyboard: menu.complaint_menu(to_link)
                }
            });
            break;
        case 'complaint_teacher_menu':
            var menu_page = Number(data[2]);
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
                        callback_data: menu.link(to_link, `complaint_teacher_text:${teacher.id}:${menu_page}`)
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
                        callback_data: menu.link(undefined, `${to_link}:${menu_page - 1}`),
                    },
                );
            }else{
                teacher_menu[teacher_menu.length - 1].push(
                    {
                        text: '←',
                        callback_data: menu.link(undefined, `${to_link}:${menu_page - 1}`),
                    },
                );
            }

            teacher_menu[teacher_menu.length - 1].push(
                menu.back_button(to_link, "complaint_menu", true)
            );

            if (menu_page + 1 >= total_pages) {
                teacher_menu[teacher_menu.length - 1].push(
                    {
                        text: ' ',
                        callback_data: menu.link(undefined, `${to_link}:${menu_page + 1}`),
                    },
                );
            }else{
                teacher_menu[teacher_menu.length - 1].push(
                    {
                        text: '→',
                        callback_data: menu.link(undefined, `${to_link}:${menu_page + 1}`),
                    },
                );
            }

            bot.editMessageText(`Вибери викладача [${menu_page+1}/${total_pages}]`, {
                chat_id: chat_id,
                message_id: callback.message.message_id,
                reply_markup: {
                    inline_keyboard: teacher_menu
                }
            });
            break;
        case 'offer_text':
            if (has_block(to_link, chat_id, 10)){
                bot.editMessageText("Ти можеш відправити лише одну пропозицію у 10 хвилин.", {
                    chat_id: chat_id,
                    message_id: callback.message.message_id,
                    reply_markup: {
                        inline_keyboard: menu.back_button(to_link, from_link)
                    }
                });
                return;
            }
            bot.editMessageText("Що в тебе є сталкер?\n\n<i>відправляй декілька пропозицій одним текстом</i>", {
                chat_id: chat_id,
                message_id: callback.message.message_id,
                reply_markup: {
                    inline_keyboard: menu.back_button(to_link, from_link)
                },
                parse_mode: "HTML"
            }).then(() => {
                db.prepare("UPDATE User SET type = ? WHERE id = ?").run(callback_data, chat_id);
            });
            break;
        case 'request_to_join_ss_text':
            if (has_block(to_link, chat_id, 30)){
                bot.editMessageText("Ти можеш відправити лише один запит на вступ у 30 хвилин.", {
                    chat_id: chat_id,
                    message_id: callback.message.message_id,
                    reply_markup: {
                        inline_keyboard: menu.back_button(to_link, from_link)
                    }
                });
                return;
            }
            bot.editMessageText(`Добре, надішли мені: \n1. ПІБ.\n2. Группу\n3. Твій дискорд <b>"DiscordTag"</b>\n\n<i>писати як список не обов'язково</i>`, {
                chat_id: chat_id,
                message_id: callback.message.message_id,
                reply_markup: {
                    inline_keyboard: menu.back_button(to_link, from_link)
                },
                parse_mode: "HTML"
            }).then(() => {
                db.prepare("UPDATE User SET type = ? WHERE id = ?").run(callback_data, chat_id);
            });
            break;
        case 'complaint_ss_text':
            if (has_block(to_link, chat_id, 10)){
                bot.editMessageText("Ти можеш відправити лише одну скаргу у 10 хвилин.", {
                    chat_id: chat_id,
                    message_id: callback.message.message_id,
                    reply_markup: {
                        inline_keyboard: menu.back_button(to_link, from_link)
                    }
                });
                return;
            }
            bot.editMessageText("Добре, надішли мені скаргу.", {
                chat_id: chat_id,
                message_id: callback.message.message_id,
                reply_markup: {
                    inline_keyboard: menu.back_button(to_link, from_link)
                }
            }).then(() => {
                db.prepare("UPDATE User SET type = ? WHERE id = ?").run(callback_data, chat_id);
            });
            break;
        case 'complaint_teacher_text':
            if (has_block(to_link, chat_id, 10)){
                bot.editMessageText("Ти можеш відправити лише одну скаргу у 10 хвилин.", {
                    chat_id: chat_id,
                    message_id: callback.message.message_id,
                    reply_markup: {
                        inline_keyboard: menu.back_button(to_link, `${from_link}:${data[3]}`)
                    }
                });
                return;
            }
            var teacher = db.prepare("SELECT name FROM Teacher WHERE id = ?").get(data[2]).name;
            bot.editMessageText(`Добре, надішли мені скаргу на ${teacher}`, {
                chat_id: chat_id,
                message_id: callback.message.message_id,
                reply_markup: {
                    inline_keyboard: menu.back_button(to_link, `${from_link}:${data[3]}`)
                }
            }).then(() => {
                db.prepare("UPDATE User SET type = ? WHERE id = ?").run(callback_data, chat_id);
            });
            break;
    }
});


bot.on('message', (msg) => {
    if (env.ADMIN_ID == 0) {
        console.log(`ADMIN_ID: ${msg.from.id}`);
    }
    
    if (env.GROUP_ID == 0) {
        console.log(`GROUP_ID: ${msg.chat.id}`);
        return;
    }

    if (env.MAINTENANCE == "true" && msg.from.id != env.ADMIN_ID){
        bot.sendMessage(msg.chat.id, "Бот на технічному обслуговуванні.");
        return;
    }

    const chat_id = msg.chat.id;

    if (msg.chat.id == env.GROUP_ID) {
        const args = msg.text.split(" ");
        const command = args.shift().toLowerCase().split("@")[0];
        switch (command) {
            case '/add_teacher':
                var arg = "";
                args.map((a) => {
                    arg += ` ${a}`;
                });

                if (arg == "") {
                    bot.sendMessage(chat_id, "Викладача не вказано.", {reply_to_message_id: msg.message_id});
                    return;
                }
                
                if (db.prepare("SELECT * FROM Teacher WHERE name = ?").get(arg) == undefined){
                    db.prepare("INSERT INTO Teacher (name) VALUES (?)").run(arg);
                    bot.sendMessage(chat_id, `Викладача ${arg} додано.`);
                    return;
                }
                bot.sendMessage(chat_id, `Викладач ${arg} вже є.`, {reply_to_message_id: msg.message_id});
                break

            case '/list_teachers':
                var teachers = db.prepare("SELECT * FROM Teacher ORDER BY name COLLATE NOCASE").all();
                var teacher_text = "Викладачі:\n";
                teachers.map((teacher, index) => {
                    teacher_text += `${index+1}: ${teacher.name}\n`;
                });
                bot.sendMessage(chat_id, teacher_text);
                break

            case '/remove_teacher':
                var arg = "";
                args.map((a) => {
                    arg += ` ${a}`;
                });

                if (arg == "") {
                    bot.sendMessage(chat_id, "Викладача не вказано.", {reply_to_message_id: msg.message_id});
                    return;
                }

                if (db.prepare("SELECT * FROM Teacher WHERE name = ?").get(arg) == undefined){
                    bot.sendMessage(chat_id, `Викладача ${arg} не існує.`, {reply_to_message_id: msg.message_id});
                    return;
                }
                db.prepare("DELETE FROM Teacher WHERE name = ?").run(arg);
                bot.sendMessage(chat_id, `${arg} видалено.`);
                break

            case '/help':
                bot.sendMessage(chat_id, "Список команд:\n/add_teacher - додати викладача\n/list_teachers - список викладачів\n/remove_teacher - видалити викладача\n/help - список команд");
                break

            default:
                break;
        }

        return;
    }

    if (msg.text == "/start" || msg.text == "/menu") {
        db.prepare("INSERT OR IGNORE INTO User (id, type) VALUES (?, ?)").run(chat_id, "");
        bot.sendMessage(chat_id, "Що тобі потрібно сталкер?", {
            reply_markup: {
                inline_keyboard: menu.main_menu
            }
        });
        return;
    }


    var data = db.prepare("SELECT type FROM User WHERE id = ?").get(chat_id).type;
    data = data.split(":");

    switch (data[1]) {  
        case 'offer_text':
            db.prepare("INSERT INTO BlockList (id, type, time) VALUES (?, ?, ?)").run(chat_id, data[1], date.getTime());
            db.prepare("UPDATE User SET type = ? WHERE id = ?").run("", chat_id);
            success_message(chat_id, "Твоя пропозиція була відправлена!");
            send_message_to_group("Пропозиція", msg.text)
            break;
        case 'request_to_join_ss_text':
            db.prepare("INSERT INTO BlockList (id, type, time) VALUES (?, ?, ?)").run(chat_id, data[1], date.getTime());
            db.prepare("UPDATE User SET type = ? WHERE id = ?").run("", chat_id);
            success_message(chat_id, "Твоя заявка була відправлена!");
            send_message_to_group(`Заявка на вступ <i>@${msg.from.username}</i>`, msg.text)
            break;
        case 'complaint_ss_text':
            db.prepare("INSERT INTO BlockList (id, type, time) VALUES (?, ?, ?)").run(chat_id, data[1], date.getTime());
            db.prepare("UPDATE User SET type = ? WHERE id = ?").run("", chat_id);
            success_message(chat_id, "Твою скаргу було відправлено!");
            send_message_to_group("Скарга на СС", msg.text)
            break;
        case 'complaint_teacher_text':
            db.prepare("INSERT INTO BlockList (id, type, time) VALUES (?, ?, ?)").run(chat_id, data[1], date.getTime());
            db.prepare("UPDATE User SET type = ? WHERE id = ?").run("", chat_id);
            var teacher = db.prepare("SELECT name FROM Teacher WHERE id = ?").get(data[2]).name;
            success_message(chat_id, `Твою скаргу на ${teacher} було відправлено!`);
            send_message_to_group(`Скарга на <i>${teacher}</i>`, msg.text)
            break;
    }
});