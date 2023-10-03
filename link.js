// last link
var from;
// link where we want to go
var to;

var callback_data = "";
var data = [];

const db = require("./database").sqlite;


module.exports = {
    from,
    to,
    callback_data,
    data,
    gen_link(_from, _to){
        return `${_from}:${_to}`
    },
    gen_code(type, url, expired_at = null){
        const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let code = "";

        for (let i = 0; i < 8; i++) {
            const randomIndex = Math.floor(Math.random() * charset.length);
            code += charset.charAt(randomIndex);
        }

        try {
            db.prepare("INSERT INTO Link (shorted, url, type, expired_at) VALUES (?, ?, ?, ?)").run(code, url, type, expired_at);
        } catch (e) {
            return this.gen_code(type, url, expired_at);
        }

        return code;
    },
    register_page(url){
        if(db.prepare("SELECT * FROM Link WHERE url = ?").get(url))
            return;

        this.gen_code("page", url);
    },
    unregister_page(url){
        db.prepare("DELETE FROM Link WHERE url = ?").run(url);
    },
    back_button(_to, object = false){
        if (object)
            return {
                text: 'Назад',
                callback_data: this.gen_link(this.to, _to),
            };
    
        return [
            [
                {
                    text: 'Назад',
                    callback_data: this.gen_link(this.to, _to),
                }
            ]
        ];
    }
}