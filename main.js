require('dotenv').config();
const env = process.env;

const middleware = require("./middleware");

const menu = require("./menu");

const database = require("./database");
const db = database.sqlite;
database.init();

const bot = require("./telegram").bot;
const logger = require("./logger");

const link = require("./link");
const page = require("./page");
const pages = require("./pages");

pages.init()

const timers = require("./timers");
timers.init();

bot.on('callback_query', (callback) => {
    if (middleware.mantenance_mode() && !middleware.is_admin(callback.from.id)) {
        bot.answerCallbackQuery(callback.id, {
            text: "Бот на технічному обслуговуванні. Спробуйте пізніше.",
            show_alert: true
          });
        return;
    }

    const chat_id = callback.message.chat.id;

    if (db.prepare("SELECT * FROM User WHERE id = ?").get(callback.from.id) == undefined) {
        bot.sendMessage(chat_id, "Будь ласка, перезапустіть бота за допомогою команди /start. Або створіть нове меню /menu.");
        return;
    }

    logger.link(callback, callback.data);
    var data = callback.data.split(":");

    var start_timer = new Date().getTime();
    page.list.map((p) => {
        if (p.link != data[1]){
            return;
        }
        
        try {
            link.from = data[0];
            link.to = data[1];
            link.callback_data = callback.data;
            link.data = data.slice(2);
    

            p.func(callback);
        } catch (error) {
            console.error(error)
        }
    });
    var end_timer = new Date().getTime();
    console.log(`Time: ${(end_timer - start_timer)}ms`);
});


function success_message(chat_id, text) {
    bot.sendMessage(chat_id, text, {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: 'У меню',
                        callback_data: link.gen_link('success_message', 'menu')
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


bot.on('message', (msg) => {
    const date = new Date();
    const chat_id = msg.chat.id;

    if (!msg.text) {
        bot.sendSticker(chat_id, "CAACAgIAAxkBAAIPe2QOzghI9AGHX8qmR8RjOKeINamiAAI_KQACsJmoSwpWpVE_WNZyLwQ");
        return;
    }

    if (middleware.mantenance_mode() && !middleware.is_admin(msg.from.id)) {
        bot.sendMessage(msg.chat.id, "Бот на технічному обслуговуванні.");
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
        db.prepare("INSERT OR IGNORE INTO User (id) VALUES (?)").run(chat_id);
        bot.sendMessage(chat_id, "Що тобі потрібно сталкер?", {
            reply_markup: {
                inline_keyboard: menu.main_menu(chat_id)
            }
        });
        return;
    }

    if (db.prepare("SELECT * FROM User WHERE id = ?").get(msg.from.id) == undefined) {
        bot.sendMessage(chat_id, "Будь ласка, перезапустіть бота за допомогою команди /start. Або створіть нове меню /menu.");
        return;
    }

    const args = msg.text.split(" ");
    const command = args.shift().toLowerCase().split("@")[0];

    if (command == "/admin_invite") {
        if (args[0] == undefined) {
            bot.sendMessage(chat_id, "Введи код");
            return;
        }

        if(db.prepare("SELECT * FROM User WHERE id = ?").get(chat_id).is_admin == 1) {
            bot.sendMessage(chat_id, "Ти вже адмін.");
            return;
        }

        if (db.prepare("SELECT * FROM InviteCode WHERE code = ? AND type = ?").get(args[0], "admin") == undefined) {
            bot.sendMessage(chat_id, ":(");
            return;
        }

        if (db.prepare("SELECT * FROM InviteCode WHERE user_id = ? AND type = ?").get(msg.from.id, "admin")) {
            bot.sendMessage(chat_id, "Зачекай.");
            return;
        }

        if (db.prepare("SELECT * FROM InviteCode WHERE code = ? AND type = ?").get(args[0], "admin").user_id != null) {
            bot.sendMessage(chat_id, "Код вже використано.");
            return;
        }

        db.prepare('UPDATE InviteCode SET user_id = ? WHERE code = ?')
            .run(chat_id, args[0]);
        db.prepare('UPDATE User SET last_name = ?, first_name = ?, username = ? WHERE id = ?').run(msg.from.last_name, msg.from.first_name, msg.from.username, chat_id);

        bot.getChat(env.OWNER_ID).then((chat) => {
            bot.sendMessage(chat_id, `Добре, тепер зачекай поки @${chat.username} підтвердить запрошення.`);
        });

        bot.sendMessage(env.OWNER_ID, `Користувач ${msg.from.first_name} ${msg.from.last_name? msg.from.last_name : ""} (@${msg.from.username}) використав код.`);
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
            logger.log(msg, "Sended to group");
            break;
        case 'request_to_join_ss_text':
            db.prepare("INSERT INTO BlockList (id, type, time) VALUES (?, ?, ?)").run(chat_id, data[1], date.getTime());
            db.prepare("UPDATE User SET type = ? WHERE id = ?").run("", chat_id);
            success_message(chat_id, "Твоя заявка була відправлена!");
            send_message_to_group(`Заявка на вступ <i>@${msg.from.username}</i>`, msg.text)
            logger.log(msg, "Sended to group");
            break;
        case 'complaint_ss_text':
            db.prepare("INSERT INTO BlockList (id, type, time) VALUES (?, ?, ?)").run(chat_id, data[1], date.getTime());
            db.prepare("UPDATE User SET type = ? WHERE id = ?").run("", chat_id);
            success_message(chat_id, "Твою скаргу було відправлено!");
            send_message_to_group("Скарга на СС", msg.text)
            logger.log(msg, "Sended to group");
            break;
        case 'complaint_teacher_text':
            db.prepare("INSERT INTO BlockList (id, type, time) VALUES (?, ?, ?)").run(chat_id, data[1], date.getTime());
            db.prepare("UPDATE User SET type = ? WHERE id = ?").run("", chat_id);
            var teacher = db.prepare("SELECT name FROM Teacher WHERE id = ?").get(data[2]).name;
            success_message(chat_id, `Твою скаргу на ${teacher} було відправлено!`);
            send_message_to_group(`Скарга на <i>${teacher}</i>`, msg.text)
            logger.log(msg, "Sended to group");
            break;
    }
});