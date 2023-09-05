const link = require("../link");
const page = require("../page");
const bot = require("../telegram").bot;

module.exports = {
    name: "ss_media",
    func (callback) {
        bot.editMessageText("Наші соц. мережі", {
            chat_id: callback.message.chat.id,
            message_id: callback.message.message_id,
            reply_markup: {
                inline_keyboard: [
                    // [
                    //     {
                    //         text: "🫠 ТікТок",
                    //         url: "https://bit.ly/3s3mWlt"
                    //     }
                    // ],
                    [
                        {
                            text: "🩴 Telegram",
                            url: "https://t.me/zfkkt"
                        },
                        {
                            text: "👾 Discord",
                            url: "https://discord.gg/2dWXTpwqQt"
                        },
                        {
                            text: "📸 Instagram",
                            url: "https://www.instagram.com/zfkkt"
                        }
                    ],
                    [
                        {
                            text: 'Назад',
                            callback_data: link.gen_link(link.to, "ss_menu")
                        }
                    ]
                ]
            }
        });
    }
}