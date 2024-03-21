const bot = require("../../telegram").bot;
const db = require("../../database").sqlite;
const link = require("../../link");
const env = process.env;

module.exports = {
    name: "post_preview",
    access: "admin",
    func (callback) {
        const data = link.data;
        const post_id = data[0];
        const post_content = db.prepare("SELECT * FROM PostContent WHERE post_id = ?").all(post_id);

        var media = [];
        post_content.forEach((content) => {
            const post_object = JSON.parse(content.post_object);
            media.push(post_object);
        });

        bot.deleteMessage(callback.message.chat.id, callback.message.message_id);

        if(media[0].text) {
            bot.copyMessage(callback.from.id, media[0].chat.id, media[0].message_id);
        } else if(media[0].poll) {
            bot.copyMessage(callback.from.id, media[0].chat.id, media[0].message_id);
            bot.forwardMessage(callback.from.id, media[0].chat.id, media[0].message_id);
        } else if(media[0].animation) {
            bot.sendAnimation(callback.from.id, media[0].animation.file_id, {
                caption: media[0].caption,
                caption_entities: media[0].caption_entities
            });
        } else {
            bot.sendMediaGroup(callback.from.id, media.map((m) => {
                return {
                    type: m.photo? "photo" : "video",
                    media: m.photo? m.photo[0].file_id : m.video.file_id,
                    caption: m.caption,
                    caption_entities: m.caption_entities
                }
            }));
        }

        setTimeout(() => {
            bot.sendMessage(callback.from.id, "Повернутись назад", {
                reply_markup: {
                    inline_keyboard: [
                        [
                            link.back_button(`post_menu:${post_id}`, true)
                        ]
                    ]
                }
            });
        }, 50);
    }
}
