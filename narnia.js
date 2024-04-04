const db = require("./database").sqlite;

module.exports = {
    // return array
    get_all() {
        return db.prepare("SELECT * FROM BotNarnia").all();
    },

    // return value or null
    get_value(key) {
        if (!key)
            return null;

        const res = db.prepare("SELECT value FROM BotNarnia WHERE key = ?").get(key);
        if (res == null)
            return null;

        return res.value;
    },

    // return value or null
    get_key(value) {
        if (!value)
            return null;

        const res = db.prepare("SELECT key FROM BotNarnia WHERE value = ?").get(value);
        if (res == null)
            return null;

        return res.key;
    },

    is_permanent(key) {
        if(!key)
            return null;

        const res = db.prepare("SELECT permanent FROM BotNarnia WHERE key = ?").get(key);
        if (res == null)
            return null;

        return res.permanent == 1;
    },

    // return boolean
    set(key, value) {
        if (!key || value === undefined)
            return null;

        if (this.get_value(key)) {
            const permanent = this.is_permanent(key);

            if (permanent == null)
                return null;

            if (permanent) {
                db.prepare("UPDATE BotNarnia SET value = ? WHERE key = ?").run(value, key);
                return;
            }
        }

        db.prepare("INSERT OR REPLACE INTO BotNarnia (key, value) VALUES (?, ?)").run(key, value);
    },

    set_permanent(key, value) {
        if (!key || value === undefined)
            return null;

        db.prepare("INSERT OR IGNORE INTO BotNarnia (key, value, permanent) VALUES (?, ?, 1)").run(key, value);
    },

    remove(key, permanent_remove = false) {
        if (!key)
            return null;

        const permanent = this.is_permanent(key);

        if (permanent == null)
            return null;

        if (!permanent_remove)
            if (permanent)
                return null;

        db.prepare("DELETE FROM BotNarnia WHERE key = ?").run(key);
    },

    template_it(text) {
        // %([^%]+)%
        const regex = /%([^%]+)%/g;

        let result = text;
        while ((match = regex.exec(text)) !== null) {
            const placeholder = match[0];
            const variable = match[1];

            const value = this.get_value(variable);
            if (value == null) {
                continue;
            }
            result = result.replace(placeholder, value);
        }

        return result;
    },

    group_names: {
        ss_zmi_chat_id: "ЗМІ",
        ss_tekhniky_chat_id: "Техніки",
        ss_sekretariat_chat_id: "Секрітаріат",
        ss_sport_chat_id: "Спорт",
        ss_zp_chat_id: "ЗП",
        ss_ks_chat_id: "КС"
    },

    ss_chats: [
        "ss_main_chat_id",
        "ss_zmi_chat_id",
        "ss_tekhniky_chat_id",
        "ss_sekretariat_chat_id",
        "ss_sport_chat_id",
        "ss_zp_chat_id",
        "ss_ks_chat_id",
    ],

    channel_names: {
        ss_zfkkt_channel_id: "ЗФККТ НОВИНИ",
        ss_tumbochka_channel_id: "Казна СС"
    },


    ss_channels: [
        "ss_zfkkt_channel_id",
        "ss_tumbochka_channel_id"
    ],

    permanent: [
        "skargy_chat_id",
        "gram_session_hash"
    ],

    init() {
        this.ss_chats.forEach(key => {
            this.set_permanent(key, "some_id");
        });

        this.ss_channels.forEach(key => {
            this.set_permanent(key, "some_id");
        });

        this.permanent.forEach(key => {
            this.set_permanent(key, null);
        });
    },

    list_variables() {
        let text = "";
        this.get_all().forEach(({key, value}) => {
            text += `<i>${key}</i> :: <b>${value}</b>\n`
        });

        return text;
    }
}