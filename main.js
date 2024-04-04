process.env.TZ = "Europe/Kiev"; // Налаштування таймзони для bun

require('dotenv').config();
const env = process.env;

const middleware = require("./middleware");

const database = require("./database");
const db = database.sqlite;
database.init();

const bot = require("./telegram").bot;
const bot_info = await bot.getMe();

const gram = require("./gram");
await gram.init();

const logger = require("./logger");

const link = require("./link");
const page = require("./page");
page.init();

const command = require("./command");
command.init();

const timers = require("./timers");
timers.init();

const narnia = require("./narnia");
narnia.init();

function open_link(callback) {
    var start_timer = new Date().getTime();
    var data = callback.data.split(":");
    const user_admin = middleware.is_admin(callback.from.id);
    const user_owner = middleware.is_owner(callback.from.id);
    const user_ss = middleware.is_ss(callback.from.id);

    page.list.every((p) => {
        if (p.link != data[1]){
            return true; // continue
        }

        var tc = data[0].split("_");
        if (tc[tc.length - 1] == "text")
            db.prepare("UPDATE User SET type = ? WHERE id = ?").run(null, callback.from.id);

        if (tc[tc.length - 1] == "message") {
            console.log(callback)
            var state_data = db.prepare("SELECT type FROM User WHERE id = ?").get(callback.from.id).type;
            // if (!data)
            //     return;

            state_data = state_data.split(":");
            bot.sendMessage(narnia.get_value(state_data[2]), `${callback.from.first_name} закінчує пиздіти.`);
            db.prepare("UPDATE User SET type = ? WHERE id = ?").run(null, callback.from.id);
        }

        if (p.access == "admin" && !user_admin || p.access == "owner" && !user_owner ||
        p.access == "ss" && !user_ss) {
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

        console.log(command.type)
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
                if(command.user_id != msg.from.id)
                    return false;
                break;
            case "owner":
                if (command.user_id != msg.from.id)
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

bot.on("my_chat_member", (data) => {
    if (data.chat.type == "channel" && data.new_chat_member.status == "administrator" && data.from.id == env.OWNER_ID)
        bot.sendMessage(env.OWNER_ID,
            `Бота додано до каналу як адміна:\n`+
            `title: <b>${data.chat.title}</b>, id: <code>${data.chat.id}</code>`,
            {
                parse_mode: "HTML"
            }
        );
})

bot.on('message', async (msg) => {
    const date = new Date();

    if (msg.text && msg.text.startsWith("/")){
        execute_command(msg);
        return;
    }

    if (msg.chat.type =="private" && middleware.is_admin(msg.from.id) && db.prepare("SELECT type FROM User WHERE id = ?").get(msg.from.id).type == null) {

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

    if (msg.chat.id == await narnia.get_value(narnia.ss_chats[0]) && msg.new_chat_member) {
        const user_first_name = msg.new_chat_member.first_name;
        const user_id = msg.new_chat_member.id;

        let text = `Привіт ${user_first_name}! Тепер ти новий член CC.... "Тут може бути ваша реклама"`;

        if(middleware.was_in_ss(user_id)) {
            text = `${user_first_name} з поверненям 🐰🎩`;

            bot.unbanChatMember(narnia.get_value("ss_tumbochka_channel_id"), user_id, {
                only_if_banned: true
            });
        }

        // !!!
        bot.sendMessage(msg.chat.id, text, {
            reply_markup: {
                inline_keyboard: [
                    narnia.ss_channels.map(channel_key => {
                        const channel_id = narnia.get_value(channel_key);
                        const channel_name = narnia.channel_names[channel_key];

                        return {
                            text: channel_name,
                            url: `https://t.me/c/${channel_id.toString().slice(4)}`
                        }
                    })
                ]
            }
        });
    }

    if (msg.chat.id == await narnia.get_value(narnia.ss_chats[0]) && msg.left_chat_member) {
        bot.sendMessage(msg.chat.id, `"А старички все уходят и уходят..."`, {
            reply_to_message_id: msg.message_id
        });
    }

    if (msg.new_chat_member && msg.new_chat_member.id == bot_info.id) {
        bot.sendMessage(msg.chat.id, "Здоров я <b>ЗФККТ БОТ</b>.\nРоблю речі які не робить людина.\n<i>Питають дружину де вона бере команди а вона каже</i> /help\n",{
            parse_mode: "HTML"
        });

        if (narnia.ss_chats.find(e => {return narnia.get_value(e) == msg.chat.id})) {
            db.prepare("INSERT OR IGNORE INTO GroupChat (id, news_distribution) VALUES (?, 0)").run(msg.chat.id);
            return;
        }

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

    if (msg.chat.type != "private" && msg.reply_to_message) {
        if (!middleware.is_ss(msg.from.id))
            return;

        const from_user_message = db.prepare("SELECT * FROM Transmission WHERE sent_to_chat_id = ? AND sent_msg_id = ?").get(msg.chat.id, msg.reply_to_message.message_id);
        const from_group_message = db.prepare("SELECT * FROM Transmission WHERE original_msg_chat_id = ? AND original_msg_id = ?").get(msg.chat.id, msg.reply_to_message.message_id);

        if (!from_user_message && !from_group_message)
            return;

        const transmission_message = from_user_message? from_user_message: from_group_message;

        const to_chat_id = from_group_message? from_group_message.sent_to_chat_id: from_user_message.original_msg_chat_id;
        const reply_message = from_user_message? from_user_message.original_msg_id: from_group_message.sent_msg_id;

        let sent_message = await bot.copyMessage(to_chat_id, msg.chat.id, msg.message_id, {
            reply_to_message_id: reply_message
        });

        const sql_query = "INSERT INTO Transmission (user_id, original_msg_chat_id, original_msg_id, sent_msg_id, sent_to_chat_id) VALUES (?, ?, ?, ?, ?)";
        db.prepare(sql_query).run(msg.from.id, msg.chat.id, msg.message_id, sent_message.message_id, transmission_message.user_id);
    }

    if (msg.chat.type != "private")
        return;

    db.prepare("INSERT OR IGNORE INTO User (id) VALUES (?)").run(msg.chat.id);

    if (msg.text && msg.text.match(/^(http|https):\/\//)) {
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

    const chat_id = msg.chat.id;

    var data = db.prepare("SELECT type FROM User WHERE id = ?").get(chat_id).type;
    if (!data)
        return;

    data = data.split(":");


    switch (data[1]) {
        case 'ss_transmission_message':
            const to_chat_id = narnia.get_value(data[2]);

            let sent_message = 0;

            if (msg.reply_to_message) {
                const from_group_message = db.prepare("SELECT * FROM Transmission WHERE sent_to_chat_id = ? AND sent_msg_id = ?").get(msg.chat.id, msg.reply_to_message.message_id);
                const from_user_message = db.prepare("SELECT * FROM Transmission WHERE original_msg_chat_id = ? AND original_msg_id = ?").get(msg.chat.id, msg.reply_to_message.message_id);

                sent_message = await bot.copyMessage(to_chat_id, msg.chat.id, msg.message_id, {
                    reply_to_message_id: from_group_message? from_group_message.original_msg_id: from_user_message.sent_msg_id
                });
            } else {
                sent_message = await bot.copyMessage(to_chat_id, msg.chat.id, msg.message_id);
            }

            const sql_query = "INSERT INTO Transmission (user_id, original_msg_chat_id, original_msg_id, sent_msg_id, sent_to_chat_id) VALUES (?, ?, ?, ?, ?)";
            db.prepare(sql_query).run(msg.from.id, msg.chat.id, msg.message_id, sent_message.message_id, to_chat_id);
            break;
    }

    /// Тре доробити
    if (!msg.text)
        return;

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