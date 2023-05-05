var list = [];

module.exports = { 
    list,
    register(link, func) {
        list.push({
            link: link,
            func: func
        })
    },
    init() {
        // ¯\_(ツ)_/¯
        const folder = "pages";
        var norm_path = require("path").join(__dirname, folder);

        require("fs").readdirSync(norm_path).forEach(function(file) {
            var module = require(`./${folder}/` + file);
            module.init();
        });
    }
}

// TODO rewrite array:
//  now: [ { link: 'menu:admin_menu', func: [Function: admin_menu] } ]
//  need_to be: "menu:admin_menu": { "func": [Function: admin_menu] }