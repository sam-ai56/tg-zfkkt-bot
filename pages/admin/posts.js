const bot = require("../../telegram").bot;
const db = require("../../database").sqlite;
const link = require("../../link");
const env = process.env;

module.exports = {
    name: "posts",
    access: "admin",
    func (callback) {
        const posts = db.prepare("SELECT * FROM Post WHERE posted = 1").all();

        if(posts.length == 0) {
            return bot.answerCallbackQuery(callback.id, "Немає постів", true);
        }


        var menu_page = Number(link.data[0]);
        var total_pages = 0;

        var number_of_posts = 8;

        var posts_menu = [];

        posts.reverse();

        posts.forEach((post, index) => {
            if (index % number_of_posts == 0) {
                total_pages++;
            }

            if (index < menu_page * number_of_posts || index >= (menu_page + 1) * number_of_posts){
                return;
            }

            if (index % 2 == 0) {
                posts_menu.push([]);
            }

            const date = new Date(post.posted_at);
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');

            const date_str = `${day}.${month}.${year}`;
            const time_str = `${hours}:${minutes}`;

            posts_menu[posts_menu.length - 1].push(
                {
                    text: `${time_str} / ${date_str}`,
                    callback_data: link.gen_link("posts", ["post_menu", post.id, menu_page])
                }
            );
        });

        if (menu_page >= total_pages || menu_page < 0) {
            return;
        }

        posts_menu.push([]);

        if (menu_page - 1 < 0) {
            posts_menu[posts_menu.length - 1].push(
                {
                    text: ' ',
                    callback_data: link.gen_link(undefined, [link.to, menu_page - 1]),
                },
            );
        }else{
            posts_menu[posts_menu.length - 1].push(
                {
                    text: '←',
                    callback_data: link.gen_link(undefined, [link.to, menu_page - 1]),
                },
            );
        }

        posts_menu[posts_menu.length - 1].push(
            {
                text: "Назад",
                callback_data: link.gen_link(link.to, "admin_menu")
            }
        );

        if (menu_page + 1 >= total_pages) {
            posts_menu[posts_menu.length - 1].push(
                {
                    text: ' ',
                    callback_data: link.gen_link(undefined, [link.to, menu_page + 1]),
                },
            );
        }else{
            posts_menu[posts_menu.length - 1].push(
                {
                    text: '→',
                    callback_data: link.gen_link(undefined, [link.to, menu_page + 1]),
                },
            );
        }

        bot.editMessageText(`Опубліковані пости [${menu_page+1}/${total_pages}]:`, {
            chat_id: callback.message.chat.id,
            message_id: callback.message.message_id,
            reply_markup: {
                inline_keyboard: posts_menu
            }
        });
    }
}
