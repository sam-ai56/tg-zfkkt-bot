const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();
const env = process.env;
// var dgram = require('dgram');
// var client = dgram.createSocket('udp4');;


const db = require("better-sqlite3")("sqlite.db");

db.exec(
    `
        CREATE TABLE IF NOT EXISTS Mode (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            type TEXT
        );
    `
);

db.exec(
    `
        CREATE TABLE IF NOT EXISTS Teacher (
            name TEXT PRIMARY KEY
        );
    `
);
const bot = new TelegramBot(env.BOT_TOKEN, {polling: true});

const main_menu = [
    {
        text: 'Поскаржитися',
        callback_data: 'complaint_menu'
    },
    {
        text: 'Пропозиція',
        callback_data: 'offer',
    }
]

function sucess_message(chat_id, text) {
    bot.sendMessage(chat_id, text, {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: 'Назад',
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

bot.on('callback_query', (callbackQuery) => {
    const chat_id = callbackQuery.message.chat.id;

    db.prepare("UPDATE Mode SET type = ? WHERE id = ?").run(callbackQuery.data, chat_id);

    var data = callbackQuery.data;
    data = data.split(":");
    switch (data[0]) {
        case 'menu':
            bot.editMessageText("Що тобі потрібно сталкер?", {
                chat_id: chat_id,
                message_id: callbackQuery.message.message_id,
                reply_markup: {
                    inline_keyboard: [
                        main_menu
                    ]
                }
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
                                callback_data: 'complaint_teacher_list'
                            },
                            {
                                text: 'Скарга на СС',
                                callback_data: 'complaint_ss'
                            }
                        ],
                        [
                            {
                                text: 'Назад',
                                callback_data: 'menu',
                            }
                        ]
                    ]
                }
            });
            break;
        case 'offer':
            bot.sendMessage(chat_id, "Що в тебе є сталкер?");
            break;
        case 'complaint_teacher_list':
            var teachers = db.prepare("SELECT * FROM Teacher").all();
            var teacher_menu = [];

            teachers.map((teacher, index) => {
                if (index % 3 == 0) {
                    teacher_menu.push([]);
                }
                teacher_menu[teacher_menu.length - 1].push(
                    {
                        text: teacher.name,
                        callback_data: `complaint_teacher:${teacher.name}`
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
            });
            break;
        case 'complaint_teacher':
            bot.sendMessage(chat_id, "Добре, надішли мені скаргу.");
            break;
        case 'complaint_ss':
            bot.sendMessage(chat_id, "Добре, надішли мені скаргу.");
            break;
    }
});


bot.on('message', (msg) => {
    const chat_id = msg.chat.id;
    
    if (msg.sticker) {
        bot.sendSticker(chat_id, "CAACAgIAAxkBAAEHoDpj4mRoFzW42vNRduT7PfucN7YlYAAC5wcAAiTCxjbn3DJLdJf8PC4E");

        // var message = Buffer.from(msg.sticker.file_id);
        // client.send(message, 0, message.length, 7894, 'localhost', function(err, bytes) {
        //     client.close();
        // });
        return;
    }


    if (msg.chat.id == env.GROUP_ID) {
        const args = msg.text.split(" ");
        const command = args.shift().toLowerCase(); //copilot
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
                var teachers = db.prepare("SELECT * FROM Teacher").all();
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
                inline_keyboard: [
                    main_menu
                ]
            }
        });
        return;
    }

    var md = db.prepare("SELECT type FROM Mode WHERE id = ?").get(chat_id).type;
    md = md.split(":");
    switch (md[0]) {  
        case 'offer':
            sucess_message(chat_id, "Твоя пропозиція була відправлена!");
            send_message_to_group("Пропозиція", msg.text)
            break;
        case 'complaint_teacher':
            sucess_message(chat_id, `Твою скаргу на ${md[1]} було відправлено!`);
            send_message_to_group(`Скарга на <i>${md[1]}</i>`, msg.text)
            break;
        case 'complaint_ss':
            sucess_message(chat_id, "Твою скаргу було відправлено!");
            send_message_to_group("Скарга на СС", msg.text)
            break;
    }
});