const command = require("../command");
const bot = require("../telegram").bot;
const menu = require("../menu");
const db = require("../database").sqlite;
const link = require("../link");
const axios = require("axios");

module.exports = {
    name: "start",
    description: undefined,
    type: undefined,
    chat_id: undefined,
    user_id: undefined,
    async func (msg, args) {

        const net_link = db.prepare("SELECT * FROM Link WHERE shorted = ?").get(args[0]);

        if (!net_link) {
            bot.sendMessage(msg.chat.id, "Посилання не знайдено", {
                reply_to_message_id: msg.message_id
            });
            return;
        }

        switch (net_link.type) {
            case "invite_admin":
                db.prepare("UPDATE User SET is_admin = 1 WHERE id = ?").run(msg.chat.id);
                db.prepare("DELETE FROM Link WHERE shorted = ?").run(args[0]);
                bot.sendMessage(msg.chat.id, "Ви стали адміністратором бота", {
                    reply_to_message_id: msg.message_id,
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "Далі",
                                    callback_data: link.gen_link("start", net_link.url)
                                }
                            ]
                        ]
                    }
                });
                break;
            case "page":
                bot.sendMessage(msg.chat.id, "Це посилання веде на внутрішню сторінку бота", {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "Перейти",
                                    callback_data: link.gen_link("start", net_link.url)
                                }
                            ]
                        ]
                    }
                });
                break;
            case "link":
                var domen = net_link.url.split("/")[2];
                var url = net_link.url;

                var result = undefined;

                try {
                    result = await axios.get(url);
                } catch (error) {
                    bot.sendMessage(msg.chat.id, "418 I'm a teapot", {
                        reply_to_message_id: msg.message_id
                    });
                }

                if(!result) {
                    return;
                }

                if (result.request.res.responseUrl != url) {
                    url = result.request.res.responseUrl;
                    domen = url.split("/")[2];
                }

                bot.sendMessage(msg.chat.id, `Це посилання веде на ${domen}`, {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "Відкрити в телеграмі",
                                    web_app: {
                                        url: url
                                    }
                                },
                                {
                                    text: "Відкрити в браузері",
                                    url: url
                                }
                            ]
                        ]
                    }
                });
                break;
        }
    }
}