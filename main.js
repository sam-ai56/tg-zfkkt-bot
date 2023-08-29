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
page.init();

const command = require("./command");
command.init();

const timers = require("./timers");
timers.init();

function emulate_callback_from_message(message, data) {
    return {
        from: message.from,
        message: message,
        data: data,
    }
}

function open_link(callback) {
    var start_timer = new Date().getTime();
    var data = callback.data.split(":");
    page.list.forEach((p) => {
        if (p.link != data[1]){
            return;
        }

        try {
            link.from = data[0];
            link.to = data[1];
            link.callback_data = callback.data;
            link.data = data.slice(2);


            p.func(callback);
            logger.link(callback);
        } catch (error) {
            console.error(error)
        }
        var end_timer = new Date().getTime();
        console.log(`Time: ${(end_timer - start_timer)}ms`);
    });
}

bot.on('callback_query', (callback) => {
    console.log(callback)
    if (middleware.mantenance_mode() && !middleware.is_admin(callback.from.id)) {
        bot.answerCallbackQuery(callback.id, {
            text: "Бот на технічному обслуговуванні. Спробуйте пізніше.",
            show_alert: true
          });
        return;
    }

    const chat_id = callback.message.chat.id;
    open_link(callback);

    if (db.prepare("SELECT * FROM User WHERE id = ?").get(callback.from.id) == undefined && callback.message.chat.type == "private") {
        bot.sendMessage(chat_id, "Будь ласка, перезапустіть бота або створіть нове меню /menu.");
        return;
    }

});


function execute_command(msg) {
    const args = msg.text.split(" ");
    const etc = args.shift().toLowerCase().split("@");
    var cmnd = etc[0].slice(1);

    //!!!!!!!!!!!!!!!!!!
    if(cmnd == "start")
        cmnd = "menu";

    var is_command_exist = false;
    command.list.forEach(command => {
        if (command.name != cmnd)
            return;

        is_command_exist = true;

        try {
            switch(command.type){
                case "chat" || "chat_administrators":
                    if(command.chat_id != msg.chat.id)
                        return;
                    break;
                case "chat_member":
                    if(command.chat_id != msg.chat.id)
                        return;
                    if(command.user_id != msg.user_id)
                        return;
                    break;
            }

            command.func(msg, args);
        } catch (error) {
            console.log(error);
        }
    });
    if(!is_command_exist){
        if(etc[1])
            // bot.sendMessage(msg.chat.id, "шо?", { reply_to_message_id: msg.message_id });
            bot.sendSticker(msg.chat.id, "./tsd.jpeg", { reply_to_message_id: msg.message_id })
        return;
    }
}


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
    bot.sendMessage(env.GROUP_ID, `<b>${title}</b>\n<em>${text}</em>`, {parse_mode: "HTML"});
}


var posts = [];
var timer_started = false;
// O_o ...
bot.on("channel_post", (post) => {
    if (post.chat.id != env.CHANNEL_ID)
        return;

    if (!post.photo && !post.video){
        db.prepare("SELECT * FROM GroupChat WHERE news_distribution = 1").all().forEach((chat) => {
            bot.forwardMessage(chat.id, env.CHANNEL_ID, post.message_id);
        });
        return;
    }

    posts.push(post);
    if (!timer_started){
        timer_started = true;
        setTimeout(() => {
            db.prepare("SELECT * FROM GroupChat WHERE news_distribution = 1").all().forEach((chat) => {
                bot.sendMediaGroup(chat.id, posts.forEach((p) => {
                    return {
                        type: p.photo? "photo" : "video",
                        media: p.photo? p.photo[0].file_id : p.video.file_id,
                        caption: p.caption? p.caption + `\n\n@zfkkt`: undefined,
                        caption_entities: p.caption_entities,
                    }
                }));
            });
            posts = [];
            timer_started = false;
        }, 100);
    }
});

bot.on('message', (msg) => {
    const date = new Date();

    console.log(msg.chat.id);

    if (msg.text.startsWith("/"))
        execute_command(msg);

    if (msg.chat.type == "private" && middleware.is_owner(msg.from.id) && msg.text.startsWith(">")) {
        let args = msg.text.split(" ");
        let command = args.shift().toLowerCase().substring(1);

        switch(command) {
            case "t1":
                bot.sendMessage(msg.chat.id, "Поцілуй мій блискучий металевий зад!").then((msg) => {
                    open_link(emulate_callback_from_message(msg, link.gen_link(undefined, `show_group_schedule:2:${date.getDay()}:0`)));
                });
                break;
            case "t2":
                // db.prepare("SELECT * FROM GroupChat WHERE schedule_distribution = 1").all().forEach((chat) => {
                //     console.log(chat.id);
                //     bot.sendPhoto(chat.id, "pary.jpg");
                // });

                // db.prepare("SELECT * FROM User WHERE distribution = 1").all().forEach((user) => {
                //     console.log(user.id);
                // });
                break;
            default:
                bot.sendMessage(msg.chat.id, "шо?", {reply_to_message_id: msg.message_id});
                break;
        }
    }

    console.log("")

    const chat_id = msg.chat.id;
    var username = msg.from.username? `@${msg.from.username}` : msg.from.first_name? msg.from.first_name : msg.from.last_name;

    if (!msg.text && msg.chat.type == "private") {
        console.log(msg.sticker.file_unique_id);
        bot.sendSticker(chat_id, "CAACAgIAAxkBAAJSimTdpCFJGv-SPvrk9J9bTr7X6_MPAALGIwACU_kZSX1Vt2WaGsO2MAQ");
        return;
    }

    const args = msg.text.split(" ");
    const command = args.shift().toLowerCase().split("@")[0];

    if (command == "/subscribe_schedule" && msg.chat.id != env.GROUP_ID) {
        if (msg.chat.type != "supergroup" && msg.chat.type != "group")
            return;

        const is_subscribed = db.prepare("SELECT * FROM GroupChat WHERE id = ? AND schedule_distribution = 1").get(msg.chat.id);
        if (is_subscribed != undefined) {
            bot.sendMessage(chat_id, "Ви вже підписали групу на розсилку.", {
                reply_to_message_id: msg.message_id
            });
            return;
        }

        bot.getChatMember(msg.chat.id, msg.from.id).then((member) => {
            if (member.status != "administrator" && member.status != "creator" && msg.from.id != env.OWNER_ID) {
                bot.sendMessage(chat_id, "Ти не адміністратор групи.", {
                    reply_to_message_id: msg.message_id
                });
                return;
            }

            db.prepare("INSERT OR IGNORE INTO GroupChat (id) VALUES (?)").run(msg.chat.id);
            bot.sendMessage(chat_id, "Привіт для того, щоб активувати розсилку для цього чату адміністратор повинен вибрати групу з меню після чого вона буде підписана на розсилку.", {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: 'Підписатися на розсилку',
                                callback_data: link.gen_link('group_menu', `get_group_distribution_gc:0`)
                            }
                        ]
                    ]
                }
            });
        });
        return;
    }

    if (command == "/unsubscribe_schedule" && msg.chat.id != env.GROUP_ID) {
        if (msg.chat.type != "supergroup" && msg.chat.type != "group")
            return;
        bot.getChatMember(msg.chat.id, msg.from.id).then((member) => {
            if (member.status != "administrator" && member.status != "creator" && msg.from.id != env.OWNER_ID) {
                bot.sendMessage(chat_id, "Ти не адміністратор групи.", {
                    reply_to_message_id: msg.message_id
                });
                return;
            }

            var group = db.prepare("SELECT * FROM GroupChat WHERE id = ?").get(msg.chat.id);
            if (group == undefined) {
                return;
            }

            const is_subscribed = db.prepare("SELECT * FROM GroupChat WHERE id = ? AND schedule_distribution = 0").get(msg.chat.id);
            if (is_subscribed != undefined) {
                bot.sendMessage(chat_id, "Ви вже відписали групу від розсилки.", {
                    reply_to_message_id: msg.message_id
                });
                return;
            }

            db.prepare("INSERT OR IGNORE INTO GroupChat (id) VALUES (?)").run(msg.chat.id);
            db.prepare("UPDATE GroupChat SET [group] = NULL, schedule_distribution = 0 WHERE id = ?").run(msg.chat.id);
            bot.sendMessage(chat_id, `${username} відписав групу від розсилки.`, {
                reply_to_message_id: msg.message_id
            });
        });
        return;
    }

    if (command == "/subscribe_news" && msg.chat.id != env.GROUP_ID) {
        if (msg.chat.type != "supergroup" && msg.chat.type != "group")
            return;

        const is_subscribed = db.prepare("SELECT * FROM GroupChat WHERE id = ? AND news_distribution = 1").get(msg.chat.id);
        if (is_subscribed != undefined) {
            bot.sendMessage(chat_id, "Ви вже підписали групу на розсилку новин.", {
                reply_to_message_id: msg.message_id
            });
            return;
        }

        bot.getChatMember(msg.chat.id, msg.from.id).then((member) => {
            if (member.status != "administrator" && member.status != "creator" && msg.from.id != env.OWNER_ID) {
                bot.sendMessage(chat_id, "Ти не адміністратор групи.", {
                    reply_to_message_id: msg.message_id
                });
                return;
            }

            db.prepare("INSERT OR IGNORE INTO GroupChat (id) VALUES (?)").run(msg.chat.id);
            db.prepare("UPDATE GroupChat SET news_distribution = 1 WHERE id = ?").run(msg.chat.id);
            bot.sendMessage(chat_id, "Група підписана на розсилку новин.", {
                reply_to_message_id: msg.message_id
            });
        });
        return;
    }

    if (command == "/unsubscribe_news" && msg.chat.id != env.GROUP_ID) {
        if (msg.chat.type != "supergroup" && msg.chat.type != "group")
            return;

        const is_subscribed = db.prepare("SELECT * FROM GroupChat WHERE id = ? AND news_distribution = 0").get(msg.chat.id);
        if (is_subscribed != undefined) {
            bot.sendMessage(chat_id, "Ви вже відписали групу від розсилки новин.", {
                reply_to_message_id: msg.message_id
            });
            return;
        }

        bot.getChatMember(msg.chat.id, msg.from.id).then((member) => {
            if (member.status != "administrator" && member.status != "creator" && msg.from.id != env.OWNER_ID) {
                bot.sendMessage(chat_id, "Ти не адміністратор групи.", {
                    reply_to_message_id: msg.message_id
                });
                return;
            }

            db.prepare("INSERT OR IGNORE INTO GroupChat (id) VALUES (?)").run(msg.chat.id);
            db.prepare("UPDATE GroupChat SET news_distribution = 0 WHERE id = ?").run(msg.chat.id);
            bot.sendMessage(chat_id, "Група відписана від розсилки новин.", {
                reply_to_message_id: msg.message_id
            });
        });
        return;
    }

    if (command == "/test_schedule" && msg.from.id == env.OWNER_ID) {
        if (msg.chat.type != "supergroup" && msg.chat.type != "group")
            return;

        const group = db.prepare("SELECT * FROM GroupChat WHERE id = ?").get(msg.chat.id);
        if (group == undefined) {
            bot.sendMessage(chat_id, "Група не підписана на розсилку розкладу.", {
                reply_to_message_id: msg.message_id
            });
            return;
        }
        bot.sendMessage(msg.chat.id, "Поцілуй мій блискучий металевий зад!").then((msg) => {
            open_link(emulate_callback_from_message(msg, link.gen_link(undefined, `show_group_schedule:${group.group}:${date.getDay()}:0`)));
        });
    }


    if (msg.chat.id == env.GROUP_ID) {
        const args = msg.text.split(" ");
        const command = args.shift().toLowerCase().split("@")[0];
        switch (command) {
            case '/add_teacher':
                var arg = "";
                args.forEach((a, i) => {
                    if (i != 0)
                        arg += " ";
                    arg += `${a}`;
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
                teachers.shift();
                var teacher_text = "Викладачі:\n";
                teachers.forEach((teacher, index) => {
                    teacher_text += `${index+1}: ${teacher.name}\n`;
                });
                bot.sendMessage(chat_id, teacher_text);
                break

            case '/remove_teacher':
                var arg = "";
                args.forEach((a, i) => {
                    if (i != 0)
                        arg += " ";
                    arg += `${a}`;
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

    if (msg.chat.type != "private")
        return;

    if (db.prepare("SELECT * FROM User WHERE id = ?").get(msg.from.id) == undefined) {
        bot.sendMessage(chat_id, "Будь ласка, перезапустіть бота за допомогою команди /start");
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
        case 'complaint_bot_text':
            db.prepare("INSERT INTO BlockList (id, type, time) VALUES (?, ?, ?)").run(chat_id, data[1], date.getTime());
            db.prepare("UPDATE User SET type = ? WHERE id = ?").run("", chat_id);
            success_message(chat_id, "Твою скаргу було відправлено!");
            send_message_to_group(`Скарга на бота <i>@${msg.from.username}</i>`, msg.text)
            logger.log(msg, "Sended to group");
            break;
        case 'complaint_teacher_text':
            console.log(chat_id, data[1], date.getTime())
            db.prepare("INSERT INTO BlockList (id, type, time) VALUES (?, ?, ?)").run(chat_id, data[1], date.getTime());
            db.prepare("UPDATE User SET type = ? WHERE id = ?").run("", chat_id);
            var teacher = db.prepare("SELECT name FROM Teacher WHERE id = ?").get(data[2]).name;
            success_message(chat_id, `Твою скаргу на ${teacher} було відправлено!`);
            send_message_to_group(`Скарга на <i>${teacher}</i>`, msg.text)
            logger.log(msg, "Sended to group");
            break;
    }
});