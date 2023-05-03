var list = [];

module.exports = { 
    list,
    register(link, func) {
        list.push({
            link: link,
            func: func
        })
    }
}

// TODO rewrite array:
//  now: [ { link: 'menu:admin_menu', func: [Function: admin_menu] } ]
//  need_to be: "menu:admin_menu": { "func": [Function: admin_menu] }