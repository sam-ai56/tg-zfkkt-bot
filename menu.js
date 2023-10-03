const db = require("./database").sqlite;
const link = require("./link");
const middleware = require("./middleware");

module.exports = {
    main_menu(id){
        var def = [
            [
                {
                    text: "⚖️ Поскаржитися",
                    callback_data: "menu:complaint_menu"
                },
                {
                    text: "🤓 Пропозиція",
                    callback_data: "menu:offer_text",
                },
                {
                    text: "⚡️ СС",
                    callback_data: "menu:ss_menu"
                },
            ]
        ];

        def.push([
            {
                text: "🗿 Розклад",
                callback_data: "menu:schedule_menu",
            },
        ]);

        if (middleware.is_owner(id)) {
            def.push([
                {
                    text: "Меню власника",
                    callback_data: "menu:owner_menu",
                },
                {
                    text: "Меню адміна",
                    callback_data: "menu:admin_menu",
                }
            ]);
        }

        if (middleware.is_admin(id) && !middleware.is_owner(id)) {
            def.push([
                {
                    text: "Меню адміна",
                    callback_data: "menu:admin_menu",
                }
            ]);
        }

        return def;
    },
    owner_menu() {
        return [
            [
                {
                    text: "Додати адміна",
                    callback_data: link.gen_link(link.to, "add_admin")
                },
                {
                    text: "Список адмінів",
                    callback_data: link.gen_link(link.to, "choose_admin")
                }
            ],
            [
                {
                    text: "Назад",
                    callback_data: link.gen_link(link.to, "menu")
                }
            ]
        ];
    },
    schedule_menu(id) {
        var def = [[], []];

        var day = new Date().getDay();

        if (middleware.has_group(id)){
            def[0].push({
                text: "😮 Подивитись свій розклад",
                callback_data: link.gen_link(link.to, `show_schedule:${day}`)
            });
            def[0].push({
                text: "🤔 Розклад іншої групи",
                callback_data: link.gen_link(link.to, `get_group_schedule:0`)
            });
        }else{
            def[0].push({
                text: "😮 Подивитись розклад",
                callback_data: link.gen_link(link.to, `get_group_schedule:0`)
            });
        }
        
        def[1].push({
            text: "🔔 Розклад дзвінків",
            callback_data: link.gen_link(link.to, "show_bells_schedule")
        });

        if (middleware.has_distribution(id)){
            def[1].push({
                text: "🥹 Підписатися на розсилку",
                callback_data: link.gen_link(link.to, "get_group_distribution:0")
            });
        }else{
            def[1].push({
                text: "🙄 Відписатися від розсилки",
                callback_data: link.gen_link(link.to, "unsubscribe_distribution")
            });
            // def[1].push({
            //     text: "Налаштування",
            //     callback_data: "menu:settings_schedule"
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
                    text: "😟 Скарга на викладача",
                    callback_data: link.gen_link(link.to, `complaint_teacher_menu:0`)
                },
                {
                    text: "🫣 Скарга на СС",
                    callback_data: link.gen_link(link.to, "complaint_ss_text")
                }
            ],
            [
                {
                    text: "😐 Скарга на бота",
                    callback_data: link.gen_link(link.to, "complaint_bot_text")
                },
                {
                    text: "📝 Помилка у розкладі",
                    callback_data: link.gen_link(link.to, "schedule_mistake_text")
                }
            ],
            [
                {
                    text: "Назад",
                    callback_data: link.gen_link(link.to, "menu")
                }
            ]
        ]
    },
    ss_menu() {
        return [
            [
                {
                    text: "🤗 Запит на вступ до СС",
                    web_app: {
                        url: "https://docs.google.com/forms/d/e/1FAIpQLSc0UwAcRtUUcDQj7_gN9eEVz5-sBM6FpWLFfO9lEUPMjSLz8w/viewform"
                    }
                },
                {
                    text: "🤔 Що таке СС?",
                    callback_data: link.gen_link(link.to, "ss_about")
                }
            ],
            [
                {
                    text: "💭 Наші соц. мережі",
                    callback_data: link.gen_link(link.to, "ss_media")
                },
                {
                    text: "🐗 PUMBA!",
                    callback_data: link.gen_link(link.to, "pumba_info")
                }
            ],
            [
                {
                    text: "Назад",
                    callback_data: link.gen_link(link.to, "menu")
                }
            ]
        ]
    }
}