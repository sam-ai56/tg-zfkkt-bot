function link(from, to){
    return `${from}:${to}`
}

function back_button(from, to, object = false){
    if (object)
        return {
            text: 'Назад',
            callback_data: link(from, to),
        };

    return [
        [
            {
                text: 'Назад',
                callback_data: link(from, to),
            }
        ]
    ];
}

module.exports = {
    link,
    back_button,

    main_menu: [
        [
            // {
            //     text: 'Запит на вступ до СС',
            //     callback_data: 'menu:request_to_join_ss_text',
            // },
            // {
            //     text: 'Що таке СС?',
            //     callback_data: 'complaint_menu',
            // }
        ],
        [
            {
                text: 'Поскаржитися',
                callback_data: 'menu:complaint_menu'
            },
            {
                text: 'Пропозиція',
                callback_data: 'menu:offer_text',
            },
            // {
            //     text: 'Розклад',
            //     callback_data: 'menu:complaint_menu',
            // },
            {
                text: 'СС',
                callback_data: 'menu:ss_menu'
            },
        ]
    ],
    complaint_menu(last_link) {
        return [
            [
                {
                    text: 'Скарга на викладача',
                    callback_data: link(last_link, `complaint_teacher_menu:0`)
                },
                {
                    text: 'Скарга на СС',
                    callback_data: link(last_link, 'complaint_ss_text')
                }
            ],
            [
                back_button(last_link, "menu", true)
            ]
        ]
    },
    ss_menu(last_link) {
        return [
            [
                {
                    text: 'Запит на вступ до СС',
                    callback_data: link(last_link, `request_to_join_ss_text`)
                },
                // {
                //     text: 'Що таке СС?',
                //     callback_data: link(last_link, 'complaint_ss_text')
                // }
            ],
            [
                back_button(last_link, "menu", true)
            ]
        ]
    },
    schedule_menu(last_link) {
        return [
            [
                {
                    text: 'Підписатися на розсилку розкладу',
                    callback_data: link(last_link, `schedule_text`)
                }
            ],
            [
                back_button(last_link, "menu", true)
            ]
        ]
    }
}