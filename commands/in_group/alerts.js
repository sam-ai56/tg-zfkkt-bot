const bot = require("../../telegram").bot;
const db = require("../../database").sqlite;
const env = process.env;
const bridges = require("../../bridges");

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

        try {
            let response = await fetch("https://alerts.com.ua/map.png");
            let data = await response.arrayBuffer();

            await bot.sendPhoto(msg.chat.id, Buffer.from(data), {
                reply_to_message_id: msg.message_id,
                caption: text
            },
            {
                filename: 'alerts.png',
                contentType: 'image/png',
            });
        } catch (e)
        {
            console.log(e);
        }
    }
}