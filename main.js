process.env.TZ = "Europe/Kiev"; // Налаштування таймзони для bun

require('dotenv').config();
const env = process.env;

const middleware = require("./middleware");

const database = require("./database");
const db = database.sqlite;
database.init();

const bot = require("./telegram").bot;
const bot_info = await bot.getMe();

const logger = require("./logger");

const link = require("./link");
const page = require("./page");
page.init();

const command = require("./command");
command.init();

const timers = require("./timers");
timers.init();

function open_link(callback) {
    var start_timer = new Date().getTime();
    var data = callback.data.split(":");
    var user_admin = middleware.is_admin(callback.from.id);
    var user_owner = middleware.is_owner(callback.from.id);

    page.list.every((p) => {
        if (p.link != data[1]){
            return true; // continue
        }

        var tc = data[0].split("_");
        if (tc[tc.length - 1] == "text")
            db.prepare("UPDATE User SET type = ? WHERE id = ?").run(null, callback.from.id);
    
        if (!user_admin && p.access == "admin" || !user_owner && p.access == "owner") {
    	    bot.answerCallbackQuery(callback.id, {
    		text: "😀🖕 іді нахуй",
    		show_alert: true
    	    });
    	    
    	    bot.sendMessage(env.OWNER_ID, `${callback.from.first_name} сосе хуй.`);
	    return false;
	}

        link.from = data[0];
        link.to = data[1];
        link.callback_data = callback.data;
        link.data = data.slice(2);

        try {
            p.func(callback);
            logger.link(callback);
        } catch (error) {
            console.error(error)
        }
        
        var end_timer = new Date().getTime();
        console.log(`Time: ${(end_timer - start_timer)}ms`);
        
        return false; // break
    });
}

bot.on('callback_query', (callback) => {
    db.prepare("INSERT OR IGNORE INTO User (id) VALUES (?)").run(callback.from.id);
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

    if(cmnd == "start" && !args[0])
        cmnd = "menu";

    command.list.every(command => {
        if (command.name != cmnd)
            return true;

        switch(command.type){
            case "all_group_chats":
                if(msg.chat.type != "supergroup" && msg.chat.type != "group")
                    return false;
                break;
            case "all_private_chats":
                if(msg.chat.type != "private")
                    return false;
                break;
            case "chat" || "chat_administrators":
                if(command.chat_id != msg.chat.id)
                    return false;
                break;
            case "chat_member":
                if(command.chat_id != msg.chat.id)
                    return false;
                if(command.user_id != msg.user_id)
                    return false;
                break;
        }

        try {
            command.func(msg, args);
        } catch (error) {
            console.log(error);
        }
        return false;
    });
    // if(!is_command_exist){
    //     if(!etc[1])
    //         return;

    //     if(etc[1])
    //         // if(etc[1] != "zfkkt_bot")
    //         //     return;
    //         // bot.sendMessage(msg.chat.id, "шо?", { reply_to_message_id: msg.message_id });
    //         //bot.sendSticker(msg.chat.id, "./tsd.jpeg", { reply_to_message_id: msg.message_id })
    //     return;
    // }
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

bot.on('message', async (msg) => {
    const date = new Date();
    if (msg.text && msg.text.startsWith("/")){
        execute_command(msg);
        return;
    }

    console.log(msg);

    // Якщо зфккт бота додали у группу
    if (msg.new_chat_member && msg.new_chat_member.id == bot_info.id) {
        bot.sendMessage(msg.chat.id, "Здоров я <b>ЗФККТ БОТ</b>.\nРоблю чері які не робить людина.\n<i>Питають дружину де вона бере команди а вона каже</i> /help\n",{
            parse_mode: "HTML"
        });
        db.prepare("INSERT OR IGNORE INTO GroupChat (id) VALUES (?)").run(msg.chat.id);
        // command.register_commands();
    }

    // Якщо пумбу додали у группу
    if (msg.new_chat_member && msg.new_chat_member.id == 6611370266) {
        bot.sendMessage(msg.chat.id, "Доров пумбіно\n", {
            reply_to_message_id: msg.message_id
        });
        // command.register_commands();
    }

    if (msg.chat.type == "private") {
        db.prepare("INSERT OR IGNORE INTO User (id) VALUES (?)").run(msg.chat.id);
    }

    if (msg.chat.type == "private" && msg.text && msg.text.match(/^(http|https):\/\//)) {
        if(!middleware.is_admin(msg.from.id) && !middleware.is_owner(msg.from.id))
            return;

        if(msg.text.split("/")[2] == "t.me")
            return;

        const code = link.gen_code("link", msg.text);

        bot.sendMessage(msg.chat.id, `Створено посилання.\n\n<i>посилання можливо видалити за допомогою команди <code>/removelink ${code}</code></i>\n\n<code>https://t.me/zfkkt_bot?start=${code}</code>`, {
            reply_to_message_id: msg.message_id,
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "Відкрити",
                            web_app: {
                                url: msg.text
                            }
                        }
                    ]
                ]
            }
        });
        return;
    }

    if (middleware.is_admin(msg.from.id) && msg.chat.type == "private" && db.prepare("SELECT type FROM User WHERE id = ?").get(msg.from.id).type == undefined) {
        posts.push({
            from: msg.from,
            object: msg
        });
        if (!timer_started){
            timer_started = true;
            setTimeout(() => {
                var created_at = date.getTime();
                db.prepare("INSERT INTO Post (created_by, created_at) VALUES (?, ?)").run(msg.from.id, created_at);
                var post_id = db.prepare("SELECT id FROM Post WHERE created_at = ?").get(created_at).id;
                posts.forEach((post) => {
                    db.prepare("INSERT INTO PostContent (post_id, post_object) VALUES (?, ?)").run(post_id, JSON.stringify(post.object));
                });
                bot.sendMessage(msg.chat.id, "Хочете запостити новину?", {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "Так",
                                    callback_data: link.gen_link(undefined, `post_news_q:1:${post_id}`)
                                },
                                {
                                    text: "Ні",
                                    callback_data: link.gen_link(undefined, `post_news_q:0:${post_id}`)
                                }
                            ]
                        ]
                    }
                });
                timer_started = false;
                posts = [];
            }, 100);
        }
        return;
    }

    if (msg.chat.type != "private" || !msg.text)
        return;

    const chat_id = msg.chat.id;

    var data = db.prepare("SELECT type FROM User WHERE id = ?").get(chat_id).type;
    if (!data)
        return;

    data = data.split(":");

    switch (data[1]) {
        case 'offer_text':
            db.prepare("INSERT INTO BlockList (id, type, time) VALUES (?, ?, ?)").run(chat_id, data[1], date.getTime());
            db.prepare("UPDATE User SET type = ? WHERE id = ?").run(null, chat_id);
            success_message(chat_id, "Твоя пропозиція була відправлена!");
            send_message_to_group(`Пропозиція <i>@${msg.from.username}</i>`, msg.text)
            logger.log(msg, "Sended to group");
            break;
        case 'request_to_join_ss_text':
            db.prepare("INSERT INTO BlockList (id, type, time) VALUES (?, ?, ?)").run(chat_id, data[1], date.getTime());
            db.prepare("UPDATE User SET type = ? WHERE id = ?").run(null, chat_id);
            success_message(chat_id, "Твоя заявка була відправлена!");
            send_message_to_group(`Заявка на вступ <i>@${msg.from.username}</i>`, msg.text)
            logger.log(msg, "Sended to group");
            break;
        case 'complaint_ss_text':
            db.prepare("INSERT INTO BlockList (id, type, time) VALUES (?, ?, ?)").run(chat_id, data[1], date.getTime());
            db.prepare("UPDATE User SET type = ? WHERE id = ?").run(null, chat_id);
            success_message(chat_id, "Твою скаргу було відправлено!");
            send_message_to_group("Скарга на СС", msg.text)
            logger.log(msg, "Sended to group");
            break;
        case 'complaint_bot_text':
            db.prepare("INSERT INTO BlockList (id, type, time) VALUES (?, ?, ?)").run(chat_id, data[1], date.getTime());
            db.prepare("UPDATE User SET type = ? WHERE id = ?").run(null, chat_id);
            success_message(chat_id, "Твою скаргу було відправлено!");
            send_message_to_group(`Скарга на бота <i>@${msg.from.username}</i>`, msg.text)
            logger.log(msg, "Sended to group");
            break;
        case 'complaint_teacher_text':
            db.prepare("INSERT INTO BlockList (id, type, time) VALUES (?, ?, ?)").run(chat_id, data[1], date.getTime());
            db.prepare("UPDATE User SET type = ? WHERE id = ?").run(null, chat_id);
            var teacher = db.prepare("SELECT name FROM Teacher WHERE id = ?").get(data[2]).name;
            success_message(chat_id, `Твою скаргу на ${teacher} було відправлено!`);
            send_message_to_group(`Скарга на <i>${teacher}</i>`, msg.text)
            logger.log(msg, "Sended to group");
            break;
        case 'schedule_mistake_text':
            db.prepare("INSERT INTO BlockList (id, type, time) VALUES (?, ?, ?)").run(chat_id, data[1], date.getTime());
            db.prepare("UPDATE User SET type = ? WHERE id = ?").run(null, chat_id);
            success_message(chat_id, "Твою скаргу було відправлено!");
            send_message_to_group(`Скарга на розклад <i>@${msg.from.username}</i>`, msg.text)
            logger.log(msg, "Sended to group");
            break;
    }
});


bot.on('polling_error', (error) => {
    console.error(error);
});