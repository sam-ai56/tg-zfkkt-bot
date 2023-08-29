const page = require("../page");
const bot = require("../telegram").bot;
const db = require("../database").sqlite;
const link = require("../link");

module.exports = {
    name: "get_group_distribution",
    func (callback) {
        var menu_page = Number(link.data[0]);
        var total_pages = 0;

        var group_in_one_page = 9;

        var groups = db.prepare("SELECT * FROM [Group]").all();
        var group_menu = [];

        groups.forEach((group, index) => {
            if (index % group_in_one_page == 0) {
                total_pages++;
            }

            if (index < menu_page * group_in_one_page || index >= (menu_page + 1) * group_in_one_page){
                return;
            }

            if (index % 3 == 0) {
                group_menu.push([]);
            }

            group_menu[group_menu.length - 1].push(
                {
                    text: group.name,
                    callback_data: link.gen_link(link.to, `subscribe_distribution:${group.id}`)
                }
            );
        });

        if (menu_page >= total_pages || menu_page < 0) {
            return;
        }

        group_menu.push([]);

        if (menu_page - 1 < 0) {
            group_menu[group_menu.length - 1].push(
                {
                    text: ' ',
                    callback_data: link.gen_link(undefined, `${link.to}:${menu_page - 1}`),
                },
            );
        }else{
            group_menu[group_menu.length - 1].push(
                {
                    text: '←',
                    callback_data: link.gen_link(undefined, `${link.to}:${menu_page - 1}`),
                },
            );
        }

        group_menu[group_menu.length - 1].push(
            {
                text: "Назад",
                callback_data: link.gen_link(link.to, "schedule_menu")
            }
        );

        if (menu_page + 1 >= total_pages) {
            group_menu[group_menu.length - 1].push(
                {
                    text: ' ',
                    callback_data: link.gen_link(undefined, `${link.to}:${menu_page + 1}`),
                },
            );
        }else{
            group_menu[group_menu.length - 1].push(
                {
                    text: '→',
                    callback_data: link.gen_link(undefined, `${link.to}:${menu_page + 1}`),
                },
            );
        }

        bot.editMessageText(`Вибери групу [${menu_page+1}/${total_pages}]`, {
            chat_id: callback.message.chat.id,
            message_id: callback.message.message_id,
            reply_markup: {
                inline_keyboard: group_menu
            }
        });
    }
}