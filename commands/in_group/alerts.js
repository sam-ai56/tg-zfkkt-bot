const bot = require("../../telegram").bot;
const db = require("../../database").sqlite;
const env = process.env;
const bridges = require("../../bridges");
const axios = require("axios");


module.exports = {
    name: "alerts",
    description: "Виводить повітряні тривоги по всіх областях України.",
    help_description: "Виводить повітряні тривоги по всіх областях України.",
    type: "all_group_chats",
    chat_id: undefined,
    user_id: undefined,
    async func (msg, args) {
        const bridge = await bridges.get();
        const b_data = bridge.data;

        if(!bridge) {
            bot.sendMessage(msg.chat.id, "Помилка отримання даних. Спробуйте пізніше.");
            return;
        }

        var text = "";

        // const map = await axios({
        //     method: "get",
        //     url: "https://alerts.com.ua/map.png",
        //     responseType: "stream"
        // });

        const alerts = b_data.alerts;

        text += `Повітряна тривога у регіонах:\n`

        alerts.reverse().forEach((alert) => {
            if (alert.location_type == "oblast")
                text += `❗ ${alert.location_title}\n`;
        });

        // if(!map){
        //     bot.sendMessage(msg.chat.id, text, {
        //         reply_to_message_id: msg.message_id
        //     });
        //     return;
        // }

        bot.sendPhoto(msg.chat.id, "https://alerts.com.ua/map.png", {
            reply_to_message_id: msg.message_id,
            caption: text
        });
    }
}