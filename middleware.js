const env = process.env;
const db = require("./database").sqlite;

module.exports = {
    is_admin(id) {
        var row = db.prepare("SELECT is_admin FROM User WHERE id = ?").get(id).is_admin;
        if (row == 0) {
            return false;
        }

        return true;
    },

    is_owner(id) {
        return env.OWNER_ID == id;
    },

    mantenance_mode() {
        return env.MAINTENANCE == "true";
    },

    debug_mode() {
        return env.DEBUG == "true";
    },

    has_block(type, chat_id, time) {
        var date = new Date();
        var row = db.prepare("SELECT time FROM BlockList WHERE id = ? AND type = ?").get(chat_id, type);
        if (row != undefined) { 
            if (date.getTime() - row.time < time * 60000) {
                return true;
            }
            db.prepare("DELETE FROM BlockList WHERE id = ? AND type = ?").run(chat_id, type);
        }
        return false;
    }
}