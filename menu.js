const db = require("./database").sqlite;
const link = require("./link");
const middleware = require("./middleware");

module.exports = {
    main_menu(id){
        var def = [
            // [
            //     // {
            //     //     text: 'Розклад',
            //     //     callback_data: 'menu:schedule_menu',
            //     // },
            [
                {
                    text: 'Поскаржитися',
                    callback_data: 'menu:complaint_menu'
                },
                {
                    text: 'Пропозиція',
                    callback_data: 'menu:offer_text',
                },
                {
                    text: 'СС',
                    callback_data: 'menu:ss_menu'
                },
            ]
        ];

        // if (middleware.is_owner(id)) {
        //     def.push([
        //         {
        //             text: 'Розклад',
        //             callback_data: 'menu:schedule_menu',
        //         },
        //     ]);
        // }

        def.push([
            {
                text: 'Розклад',
                callback_data: 'menu:schedule_menu',
            },
        ]);

        return def;
    },
    schedule_menu(id) {
        var def = [[], []];

        var day = new Date().getDay();

        if (middleware.has_group(id)){
            def[0].push({
                text: 'Подивитись свій розклад',
                callback_data: link.gen_link(link.to, `show_schedule:${day}`)
            });
            def[0].push({
                text: 'Розклад іншої групи',
                callback_data: link.gen_link(link.to, `get_group_schedule:0`)
            });
        }else{
            def[0].push({
                text: 'Подивитись розклад',
                callback_data: link.gen_link(link.to, `get_group_schedule:0`)
            });
        }
        
        def[1].push({
            text: 'Розклад дзвінків',
            callback_data: link.gen_link(link.to, 'show_bells_schedule')
        });

        if (middleware.has_distribution(id)){
            def[1].push({
                text: "Підписатися на розсилку",
                callback_data: link.gen_link(link.to, "get_group_distribution:0")
            });
        }else{
            def[1].push({
                text: "Відписатися від розсилки",
                callback_data: link.gen_link(link.to, "unsubscribe_distribution")
            });
            // def[1].push({
            //     text: "Налаштування",
            //     callback_data: 'menu:settings_schedule'
            // });
        }

        def.push([{
            text: "Назад",
            callback_data: link.gen_link(link.to, "menu")
        }]);

        return def;
    },
    complaint_menu() {
        return [
            [
                {
                    text: 'Скарга на викладача',
                    callback_data: link.gen_link(link.to, `complaint_teacher_menu:0`)
                },
                {
                    text: 'Скарга на СС',
                    callback_data: link.gen_link(link.to, 'complaint_ss_text')
                },
                {
                    text: 'Скарга на бота',
                    callback_data: link.gen_link(link.to, 'complaint_bot_text')
                }
            ],
            [
                {
                    text: 'Назад',
                    callback_data: link.gen_link(link.to, "menu")
                }
            ]
        ]
    },
    ss_menu() {
        return [
            [
                {
                    text: 'Запит на вступ до СС',
                    url: "https://bit.ly/43jV51B"
                },
                {
                    text: 'Що таке СС?',
                    callback_data: link.gen_link(link.to, 'ss_about')
                }
            ],
            [
                {
                    text: 'Назад',
                    callback_data: link.gen_link(link.to, "menu")
                }
            ]
        ]
    }
}