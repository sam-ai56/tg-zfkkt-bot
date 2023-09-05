require('dotenv').config();
const env = process.env;

const middleware = require("./middleware");

//const menu = require("./menu");

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

        var tc = data[0].split("_");
        if (tc[tc.length - 1 ] == "text")
            db.prepare("UPDATE User SET type = ? WHERE id = ?").run(null, callback.from.id);

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

        switch(command.type){
            case "all_group_chats":
                if(msg.chat.type != "supergroup" && msg.chat.type != "group")
                    return;
                break;
            case "all_private_chats":
                if(msg.chat.type != "private")
                    return;
                break;
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

        try {
            command.func(msg, args);
        } catch (error) {
            console.log(error);
        }
    });
    if(!is_command_exist){
        if(etc[1])
            if(etc[1] != "zfkkt_bot")
                return;
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
    return;
    if (post.chat.id != env.CHANNEL_ID)
        return;

    if (!post.photo && !post.video){
        db.prepare("SELECT * FROM GroupChat WHERE news_distribution = 1").all().forEach((chat) => {
            bot.forwardMessage(chat.id, env.CHANNEL_ID, post.message_id);
        });
        return;
    }

    // posts.push(post);
    // if (!timer_started){
    //     timer_started = true;
    //     setTimeout(() => {
    //         db.prepare("SELECT * FROM GroupChat WHERE news_distribution = 1").all().forEach((chat) => {
    //             console.log(posts);
    //             if (posts.length == 1)
    //                 return bot.forwardMessage(chat.id, env.CHANNEL_ID, posts[0].message_id);
    //             bot.sendMediaGroup(chat.id, posts.forEach((p) => {
    //                 return {
    //                     type: p.photo? "photo" : "video",
    //                     media: p.photo? p.photo[0].file_id : p.video.file_id,
    //                     caption: p.caption? p.caption + `\n\n@zfkkt`: undefined,
    //                     caption_entities: p.caption_entities,
    //                 }
    //             }));
    //         });
    //         posts = [];
    //         timer_started = false;
    //     }, 100);
    // }
});

bot.on('message', (msg) => {
    const date = new Date();

    if (msg.text.startsWith("/")){
        execute_command(msg);
        return;
    }

    if (msg.chat.type != "private")
        return;

    if (db.prepare("SELECT * FROM User WHERE id = ?").get(msg.from.id) == undefined) {
        bot.sendMessage(chat_id, "Будь ласка, перезапустіть бота або створіть нове меню /menu.");
        return;
    }

    const chat_id = msg.chat.id;

    // if (!msg.text && msg.chat.type == "private") {
    //     console.log(msg.sticker.file_unique_id);
    //     bot.sendSticker(chat_id, "CAACAgIAAxkBAAJSimTdpCFJGv-SPvrk9J9bTr7X6_MPAALGIwACU_kZSX1Vt2WaGsO2MAQ");
    //     return;
    // }

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