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

        if (middleware.is_owner(id)) {
            def.push([
                {
                    text: 'Нарнія',
                    callback_data: 'menu:owner_menu'
                },
                {
                    text: 'Адмін меню',
                    callback_data: 'menu:admin_menu'
                },
            ]);
        }

        if (middleware.is_admin(id) && !middleware.is_owner(id)) {
            def.push([
                {
                    text: 'Адмін меню',
                    callback_data: 'menu:admin_menu'
                },
            ]);
        }

        return def;
    },
    owner_menu() {
        return [
            [
                {
                    text: 'Створити код',
                    callback_data: link.gen_link(link.to, 'create_admin_code')
                },
                {
                    text: 'Пітвердити адміна',
                    callback_data: link.gen_link(link.to, 'confirm_admin_menu')
                },
                {
                    text: 'Адміни',
                    callback_data: link.gen_link(link.to, 'list_admins')
                },
            ],
            [
                {
                    text: 'Назад',
                    callback_data: link.gen_link(link.to, 'menu')
                }
            ]
        ]
    },
    admin_menu() {
        return [
            [
                {
                    text: 'Створити меню',
                    callback_data: link.gen_link(link.to, 'create_menu')
                },
                {
                    text: 'Видалити меню',
                    callback_data: link.gen_link(link.to, 'delete_menu')
                },
            ],
            [
                {
                    text: 'Назад',
                    callback_data: link.gen_link(link.to, 'menu')
                }
            ]
        ]
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
                    callback_data: link.gen_link(link.to, `request_to_join_ss_text`)
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
    },
    schedule_menu() {
        return [
            [
                {
                    text: 'Подивитись розклад',
                    callback_data: link.gen_link(`schedule_text`)
                },
                {
                    text: 'Налаштування',
                    callback_data: link.gen_link(`schedule_text`)
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