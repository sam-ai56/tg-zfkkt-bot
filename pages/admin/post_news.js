const bot = require("../../telegram").bot;
const db = require("../../database").sqlite;
const link = require("../../link");
const env = process.env;

function send_post(post_id, post_content, to_channel, to_groups, callback){
    db.prepare("UPDATE Post SET to_channel = ?, to_group = ? WHERE id = ?").run(to_channel? "1": "0", to_groups? "1": "0", post_id);
    var media = [];
    post_content.forEach((content) => {
        const post_object = JSON.parse(content.post_object);
        media.push(post_object);
    });

    if(to_channel) {
        if(media[0].text) {
            // я неможу відправити текст з entities через sendMessage, тому я використовую copyMessage
            bot.copyMessage(env.CHANNEL_ID, media[0].chat.id, media[0].message_id).then((sended_message) => {
                db.prepare("INSERT INTO PostDistribution (post_id, chat_id, message_id) VALUES (?, ?, ?)").run(post_id, env.CHANNEL_ID, sended_message.message_id);
            });
        } else if(media[0].poll) {
            bot.forwardMessage(env.CHANNEL_ID, media[0].chat.id, media[0].message_id, {protect_content: true}).then((sended_message) => {
                db.prepare("INSERT INTO PostDistribution (post_id, chat_id, message_id) VALUES (?, ?, ?)").run(post_id, env.CHANNEL_ID, sended_message.message_id);
            });
        } else if(media[0].animation) {
            bot.sendAnimation(env.CHANNEL_ID, media[0].animation.file_id, {
                caption: media[0].caption,
                caption_entities: media[0].caption_entities
            }).then((sended_message) => {
                db.prepare("INSERT INTO PostDistribution (post_id, chat_id, message_id) VALUES (?, ?, ?)").run(post_id, env.CHANNEL_ID, sended_message.message_id);
            });
        } else {
            bot.sendMediaGroup(env.CHANNEL_ID, media.map((m) => {
                return {
                    type: m.photo? "photo" : "video",
                    media: m.photo? m.photo[0].file_id : m.video.file_id,
                    caption: m.caption,
                    caption_entities: m.caption_entities
                }
            })).then((sended_message) => {
                sended_message.forEach((message) => {
                    db.prepare("INSERT INTO PostDistribution (post_id, chat_id, message_id) VALUES (?, ?, ?)").run(post_id, env.CHANNEL_ID, message.message_id);
                });
            });
        }
    }

    if(to_groups) {
        if(media[0].text) {
            db.prepare("SELECT * FROM GroupChat WHERE news_distribution = 1").all().forEach((chat) => {
                bot.copyMessage(chat.id, media[0].chat.id, media[0].message_id).then((sended_message) => {
                    db.prepare("INSERT INTO PostDistribution (post_id, chat_id, message_id) VALUES (?, ?, ?)").run(post_id, chat.id, sended_message.message_id);
                });
            });
        } else if(media[0].poll) {
            db.prepare("SELECT * FROM GroupChat WHERE news_distribution = 1").all().forEach((chat) => {
                bot.forwardMessage(chat.id, media[0].chat.id, media[0].message_id, {protect_content: true}).then((sended_message) => {
                    db.prepare("INSERT INTO PostDistribution (post_id, chat_id, message_id) VALUES (?, ?, ?)").run(post_id, chat.id, sended_message.message_id);
                });
            });
        } else if(media[0].animation) {
            db.prepare("SELECT * FROM GroupChat WHERE news_distribution = 1").all().forEach((chat) => {
                bot.sendAnimation(chat.id, media[0].animation.file_id, {
                    caption: media[0].caption,
                    caption_entities: media[0].caption_entities
                }).then((sended_message) => {
                    db.prepare("INSERT INTO PostDistribution (post_id, chat_id, message_id) VALUES (?, ?, ?)").run(post_id, chat.id, sended_message.message_id);
                });
            });
        } else {
            db.prepare("SELECT * FROM GroupChat WHERE news_distribution = 1").all().forEach((chat) => {
                bot.sendMediaGroup(chat.id, media.map((m) => {
                    return {
                        type: m.photo? "photo" : "video",
                        media: m.photo? m.photo[0].file_id : m.video.file_id,
                        caption: m.caption,
                        caption_entities: m.caption_entities
                    }
                })).then((sended_message) => {
                    sended_message.forEach((message) => {
                        db.prepare("INSERT INTO PostDistribution (post_id, chat_id, message_id) VALUES (?, ?, ?)").run(post_id, chat.id, message.message_id);
                    });
                });
            });
        }
    }

    db.prepare("UPDATE Post SET posted = 1, posted_at = ? WHERE id = ?").run(Date.now(), post_id);

    const aydyt_message = to_channel && to_groups? "Відправлення поста у канал та чати" : to_channel? "Відправлення поста у канал" : "Відправлення поста у чати";

    db.prepare("INSERT INTO AudytLog (user_id, description, post_id, at) VALUES (?, ?, ?, ?)").run(callback.from.id, aydyt_message, post_id, Date.now());

    db.prepare("SELECT * FROM User WHERE is_admin = 1").all().forEach((admin) => {
        let is_username = callback.from.username ? true : false;
        const username = is_username? callback.from.username : callback.from.first_name;
        bot.sendMessage(admin.id, `${aydyt_message} (${is_username? "@" : ""}${username})`);
    });

    const success_message = to_channel && to_groups? "Відправлено до каналу та груп!" : to_channel? "Відправлено до каналу!" : "Відправлено до груп!";

    bot.editMessageText(success_message, {
        chat_id: callback.message.chat.id,
        message_id: callback.message.message_id,
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: "Далі",
                        callback_data: link.gen_link(link.to, "admin_menu")
                    }
                ]
            ]
        }
    });
}

module.exports = {
    name: "post_news",
    async func (callback) {
        const data = link.data;
        const posted_at = Date.now();
        const post_id = data[1];

        const post_content = db.prepare("SELECT * FROM PostContent WHERE post_id = ?").all(post_id);

        switch (data[0]) {
            case "1": // send to channel
                send_post(post_id, post_content, true, false, callback);
                break;
            case "2": // send to groups
                send_post(post_id, post_content, false, true, callback);
                break;
            case "3": // send to channel, groups
                send_post(post_id, post_content, true, true, callback);
                break;
            case "0":
                db.prepare("DELETE FROM PostContent WHERE post_id = ?").run(post_id);
                db.prepare("DELETE FROM Post WHERE id = ?").run(post_id);
                bot.deleteMessage(callback.message.chat.id, callback.message.message_id);
                break;
        }
    }
}
