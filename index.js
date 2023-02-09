const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();
const env = process.env;
var dgram = require('dgram');
var client = dgram.createSocket('udp4');;


const db = require("better-sqlite3")("sqlite.db");

db.exec(
    `
        CREATE TABLE IF NOT EXISTS Mode (
            id INTEGER PRIMARY KEY NOT NULL, 
            type TEXT NOT NULL
        );
    `
);

db.exec(
    `
        CREATE TABLE IF NOT EXISTS Teacher (
            name TEXT PRIMARY KEY NOT NULL
        );
    `
);

db.exec(
    `
        CREATE TABLE IF NOT EXISTS BlockList (
            id INTEGER NOT NULL,
            type TEXT NOT NULL,
            time INTEGER NOT NULL
        );
    `
);

const bot = new TelegramBot(env.BOT_TOKEN, {polling: true});

const main_menu = [
    [
        {
            text: 'Запит на вступ до СС',
            callback_data: 'request_to_join_ss_text',
        },
        // {
        //     text: 'Що таке СС?',
        //     callback_data: 'complaint_menu',
        // }
    ],
    [
        {
            text: 'Поскаржитися',
            callback_data: 'complaint_menu'
        },
        {
            text: 'Пропозиція',
            callback_data: 'offer_text',
        },
    ]
]

function back_button(link){
    return [
        [
            {
                text: 'Назад',
                callback_data: link,
            }
        ]
    ]
}

function success_message(chat_id, text) {
    db.prepare("UPDATE Mode SET type = ? WHERE id = ?").run("back_to_menu", chat_id);
    bot.sendMessage(chat_id, text, {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: 'У меню',
                        callback_data: 'menu',
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

bot.on('callback_query', (callbackQuery) => {
    const chat_id = callbackQuery.message.chat.id;

    var last_mode = db.prepare("SELECT type FROM Mode WHERE id = ?").get(chat_id).type;

    var data = callbackQuery.data;
    data = data.split(":");
    switch (data[0]) {
        case 'menu':
            bot.editMessageText("Що тобі потрібно сталкер?", {
                chat_id: chat_id,
                message_id: callbackQuery.message.message_id,
                reply_markup: {
                    inline_keyboard: main_menu
                }
            }).then(() => {
                db.prepare("UPDATE Mode SET type = ? WHERE id = ?").run(data[0], chat_id);
            });
            break;
        case 'complaint_menu':
            bot.editMessageText("Вибери тип скарги.", {
                chat_id: chat_id,
                message_id: callbackQuery.message.message_id,
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: 'Скарга на викладача',
                                callback_data: 'complaint_teacher_menu'
                            },
                            {
                                text: 'Скарга на СС',
                                callback_data: 'complaint_ss_text'
                            }
                        ],
                        [
                            {
                                text: 'Назад',
                                callback_data: "menu",
                            }
                        ]
                    ]
                }
            }).then(() => {
                db.prepare("UPDATE Mode SET type = ? WHERE id = ?").run(data[0], chat_id);
            });
            break;
        case 'complaint_teacher_menu':
            var teachers = db.prepare("SELECT * FROM Teacher ORDER BY name COLLATE NOCASE").all();
            var teacher_menu = [];

            teachers.map((teacher, index) => {
                if (index % 3 == 0) {
                    teacher_menu.push([]);
                }
                teacher_menu[teacher_menu.length - 1].push(
                    {
                        text: teacher.name,
                        callback_data: `complaint_teacher_text:${teacher.name}`
                    }
                );
            });

            teacher_menu.push([
                {
                    text: '<',
                    callback_data: 'complaint_menu',
                }
            ]);

            bot.editMessageText("Вибери викладача.", {
                chat_id: chat_id,
                message_id: callbackQuery.message.message_id,
                reply_markup: {
                    inline_keyboard: teacher_menu
                }
            }).then(() => {
                db.prepare("UPDATE Mode SET type = ? WHERE id = ?").run(data[0], chat_id);
            });
            break;
        case 'offer_text':
            if (has_block(data[0], chat_id, 10)){
                bot.editMessageText("Ти можеш відправити лише одну пропозицію у 10 хвилин.", {
                    chat_id: chat_id,
                    message_id: callbackQuery.message.message_id,
                    reply_markup: {
                        inline_keyboard: back_button(last_mode)
                    }
                });
                return;
            }
            bot.editMessageText("Що в тебе є сталкер?\n\n<i>відправляй декілька пропозицій одним текстом</i>", {
                chat_id: chat_id,
                message_id: callbackQuery.message.message_id,
                reply_markup: {
                    inline_keyboard: back_button(last_mode)
                },
                parse_mode: "HTML"
            }).then((message) => {
                db.prepare("UPDATE Mode SET type = ? WHERE id = ?").run(`offer_text:${message.message_id}`, chat_id);
            });
            break;
        case 'request_to_join_ss_text':
            if (has_block(data[0], chat_id, 30)){
                bot.editMessageText("Ти можеш відправити лише один запит на вступ у 30 хвилин.", {
                    chat_id: chat_id,
                    message_id: callbackQuery.message.message_id,
                    reply_markup: {
                        inline_keyboard: back_button(last_mode)
                    }
                });
                return;
            }
            bot.editMessageText(`Добре, надішли мені: \n1. ПІБ.\n2. Группу\n3. Твій дискорд <b>"DiscordTag"</b>\n\n<i>писати як список не обов'язково</i>`, {
                chat_id: chat_id,
                message_id: callbackQuery.message.message_id,
                reply_markup: {
                    inline_keyboard: back_button(last_mode)
                },
                parse_mode: "HTML"
            }).then((message) => {
                db.prepare("UPDATE Mode SET type = ? WHERE id = ?").run(`request_to_join_ss_text:${message.message_id}`, chat_id);
            });
            break;
        case 'complaint_ss_text':
            if (has_block(data[0], chat_id, 10)){
                bot.editMessageText("Ти можеш відправити лише одну скаргу у 10 хвилин.", {
                    chat_id: chat_id,
                    message_id: callbackQuery.message.message_id,
                    reply_markup: {
                        inline_keyboard: back_button(last_mode)
                    }
                });
                return;
            }
            bot.editMessageText("Добре, надішли мені скаргу.", {
                chat_id: chat_id,
                message_id: callbackQuery.message.message_id,
                reply_markup: {
                    inline_keyboard: back_button(last_mode)
                }
            }).then((message) => {
                db.prepare("UPDATE Mode SET type = ? WHERE id = ?").run(`complaint_ss_text:${message.message_id}`, chat_id);
            });
            break;
        case 'complaint_teacher_text':
            if (has_block(data[0], chat_id, 10)){
                bot.editMessageText("Ти можеш відправити лише одну скаргу у 10 хвилин.", {
                    chat_id: chat_id,
                    message_id: callbackQuery.message.message_id,
                    reply_markup: {
                        inline_keyboard: back_button(last_mode)
                    }
                });
                return;
            }
            bot.editMessageText(`Добре, надішли мені скаргу на ${data[1]}`, {
                chat_id: chat_id,
                message_id: callbackQuery.message.message_id,
                reply_markup: {
                    inline_keyboard: back_button(last_mode)
                }
            }).then((message) => {
                db.prepare("UPDATE Mode SET type = ? WHERE id = ?").run(`complaint_teacher_text:${data[1]}:${message.message_id}`, chat_id);
            });
            break;
    }
});


bot.on('message', (msg) => {
    const chat_id = msg.chat.id;
    var date = new Date();

    if (msg.sticker) {
        var row = db.prepare("SELECT time FROM BlockList WHERE id = ? AND type = ?").get(chat_id, "sticker");
        if (row != undefined) {
            if (date.getTime() - row.time < 300000) {
                bot.sendMessage(chat_id, "Ти можеш відправити лише одне повідомлення у 5 хвилин.");
                return;
            }
            db.prepare("DELETE FROM BlockList WHERE id = ? AND type = ?").run(chat_id, "sticker");
        }
        bot.sendSticker(chat_id, "CAACAgIAAxkBAAEHoDpj4mRoFzW42vNRduT7PfucN7YlYAAC5wcAAiTCxjbn3DJLdJf8PC4E");

        var message = Buffer.from(msg.sticker.file_id);
        client.send(message, 0, message.length, 7894, 'localhost', function(err, bytes) {
            //client.close();
            db.prepare("INSERT INTO BlockList (id, type, time) VALUES (?, ?, ?)").run(chat_id, "sticker", date.getTime());
        });
        return;
    }


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
                teachers.map((teacher) => {
                    teacher_text += `${teacher.name}\n`;
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

    if (msg.text == "/start") {
        db.prepare("INSERT OR IGNORE INTO Mode (id, type) VALUES (?, ?)").run(chat_id, "menu");
        bot.sendMessage(chat_id, "Що тобі потрібно сталкер?", {
            reply_markup: {
                inline_keyboard: main_menu
            }
        });
        return;
    }

    if (msg.text == "/menu") {
        bot.sendMessage(chat_id, "Що тобі потрібно сталкер?", {
            reply_markup: {
                inline_keyboard: main_menu
            }
        });
        return;
    }



    var md = db.prepare("SELECT type FROM Mode WHERE id = ?").get(chat_id).type;
    md = md.split(":");
    switch (md[0]) {  
        case 'offer_text':
            db.prepare("INSERT INTO BlockList (id, type, time) VALUES (?, ?, ?)").run(chat_id, md[0], date.getTime());
            success_message(chat_id, "Твоя пропозиція була відправлена!");
            send_message_to_group("Пропозиція", msg.text)
            break;
        case 'request_to_join_ss_text':
            db.prepare("INSERT INTO BlockList (id, type, time) VALUES (?, ?, ?)").run(chat_id, md[0], date.getTime());
            success_message(chat_id, "Твоя заявка була відправлена!");
            send_message_to_group(`Заявка на вступ <i>@${msg.from.username}</i>`, msg.text)
            break;
        case 'complaint_ss_text':
            db.prepare("INSERT INTO BlockList (id, type, time) VALUES (?, ?, ?)").run(chat_id, md[0], date.getTime());
            success_message(chat_id, "Твою скаргу було відправлено!");
            send_message_to_group("Скарга на СС", msg.text)
            break;
        case 'complaint_teacher_text':
            db.prepare("INSERT INTO BlockList (id, type, time) VALUES (?, ?, ?)").run(chat_id, md[0], date.getTime());
            success_message(chat_id, `Твою скаргу на ${md[1]} було відправлено!`);
            send_message_to_group(`Скарга на <i>${md[1]}</i>`, msg.text)
            break;
    }
});