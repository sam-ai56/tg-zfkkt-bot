const page = require("../page");
const bot = require("../telegram").bot;
const link = require("../link");
const db = require("../database").sqlite;

module.exports = {
    name: "complaint_teacher_menu",
    func (callback) {
        var menu_page = Number(link.data[0]);
        var total_pages = 0;

        var teachers_in_one_page = 8;

        var teachers = db.prepare("SELECT * FROM Teacher ORDER BY name COLLATE NOCASE").all();
        // delete first element (id = 0)
        teachers.shift();
        var teacher_menu = [];

        teachers.forEach((teacher, index) => {
            if (index % teachers_in_one_page == 0) {
                total_pages++;
            }

            if (index < menu_page * teachers_in_one_page || index >= (menu_page + 1) * teachers_in_one_page){
                return;
            }

            if (index % 2 == 0) {
                teacher_menu.push([]);
            }

            teacher_menu[teacher_menu.length - 1].push(
                {
                    text: teacher.name,
                    callback_data: link.gen_link(link.to, `complaint_teacher_text:${teacher.id}:${menu_page}`)
                }
            );
        });

        if (menu_page >= total_pages || menu_page < 0) {
            return;
        }

        teacher_menu.push([]);

        if (menu_page - 1 < 0) {
            teacher_menu[teacher_menu.length - 1].push(
                {
                    text: ' ',
                    callback_data: link.gen_link(undefined, `${link.to}:${menu_page - 1}`),
                },
            );
        }else{
            teacher_menu[teacher_menu.length - 1].push(
                {
                    text: '←',
                    callback_data: link.gen_link(undefined, `${link.to}:${menu_page - 1}`),
                },
            );
        }

        teacher_menu[teacher_menu.length - 1].push(
            {
                text: "Назад",
                callback_data: link.gen_link(link.to, "complaint_menu")
            }
        );

        if (menu_page + 1 >= total_pages) {
            teacher_menu[teacher_menu.length - 1].push(
                {
                    text: ' ',
                    callback_data: link.gen_link(undefined, `${link.to}:${menu_page + 1}`),
                },
            );
        }else{
            teacher_menu[teacher_menu.length - 1].push(
                {
                    text: '→',
                    callback_data: link.gen_link(undefined, `${link.to}:${menu_page + 1}`),
                },
            );
        }

        bot.editMessageText(`Вибери викладача [${menu_page+1}/${total_pages}]`, {
            chat_id: callback.message.chat.id,
            message_id: callback.message.message_id,
            reply_markup: {
                inline_keyboard: teacher_menu
            }
        });
    }
}