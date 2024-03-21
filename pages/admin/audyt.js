const bot = require("../../telegram").bot;
const db = require("../../database").sqlite;
const link = require("../../link");
const env = process.env;

module.exports = {
    name: "audyt",
    access: "admin",
    func (callback) {
        const audyts = db.prepare("SELECT * FROM AudytLog").all();

        if(audyts.length == 0) {
            return bot.answerCallbackQuery(callback.id, "Журнал аудиту пустий", true);
        }

        var menu_page = Number(link.data[0]);
        var total_pages = 0;

        var number_of_audyts = 8;

        var audyts_menu = [];

        audyts.reverse();

        audyts.forEach((post, index) => {
            if (index % number_of_audyts == 0) {
                total_pages++;
            }

            if (index < menu_page * number_of_audyts || index >= (menu_page + 1) * number_of_audyts){
                return;
            }

            if (index % 2 == 0) {
                audyts_menu.push([]);
            }

            const date = new Date(post.at);
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');

            const date_str = `${day}.${month}.${year}`;
            const time_str = `${hours}:${minutes}`;

            audyts_menu[audyts_menu.length - 1].push(
                {
                    text: `${time_str} / ${date_str}`,
                    callback_data: link.gen_link("audyts", ["audyt_info", post.id, menu_page])
                }
            );
        });

        if (menu_page >= total_pages || menu_page < 0) {
            return;
        }

        audyts_menu.push([]);

        if (menu_page - 1 < 0) {
            audyts_menu[audyts_menu.length - 1].push(
                {
                    text: ' ',
                    callback_data: link.gen_link(undefined, [link.to, menu_page - 1]),
                },
            );
        }else{
            audyts_menu[audyts_menu.length - 1].push(
                {
                    text: '←',
                    callback_data: link.gen_link(undefined, [link.to, menu_page - 1]),
                },
            );
        }

        audyts_menu[audyts_menu.length - 1].push(
            {
                text: "Назад",
                callback_data: link.gen_link(link.to, "admin_menu")
            }
        );

        if (menu_page + 1 >= total_pages) {
            audyts_menu[audyts_menu.length - 1].push(
                {
                    text: ' ',
                    callback_data: link.gen_link(undefined, [link.to, menu_page + 1]),
                },
            );
        }else{
            audyts_menu[audyts_menu.length - 1].push(
                {
                    text: '→',
                    callback_data: link.gen_link(undefined, [link.to, menu_page + 1]),
                },
            );
        }

        bot.editMessageText(`Журнал аудиту [${menu_page+1}/${total_pages}]:`, {
            chat_id: callback.message.chat.id,
            message_id: callback.message.message_id,
            reply_markup: {
                inline_keyboard: audyts_menu
            }
        });
    }
}
