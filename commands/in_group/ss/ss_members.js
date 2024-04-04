const gram = require("../../../gram");
const narnia = require("../../../narnia");

const bot = require("../../../telegram").bot;
const db = require("../../../database").sqlite;
const env = process.env;
module.exports = {
    name: "ss_members",
    description: "some",
    type: "chat",
    chat_id: narnia.get_value(narnia.ss_chats[0]),
    user_id: undefined,
    func (msg, args) {
        const members = db.prepare("SELECT * FROM User WHERE is_ss = 1").all();

        let group_names = {
            ss_zmi_chat_id: "ЗМІ",
            ss_tekhniky_chat_id: "Технік",
            ss_sekretariat_chat_id: "Секрітаріат",
            ss_sport_chat_id: "Спорт",
            ss_zp_chat_id: "ЗП",
            ss_ks_chat_id: "КС"
        };

        var text = "<b>Участники СС:</b>\n";
        text += members.map(db_user => {
            const name = `${db_user.first_name}${db_user.last_name? "" + db_user.last_name: ""}`;
            const ss_name = `${db_user.ss_name? db_user.ss_name: "Валєра"}`;

            return `<a href="tg://user?id=${db_user.id}">${name}</a> (<i>${ss_name}</i>):\n\t—\t${
                JSON.parse(db_user.ss_groups).map(chat_key => ` ${group_names[chat_key]}`)
            }\n`;
        }).join("");

        console.log(text);


        bot.sendMessage(msg.chat.id, text, {
            reply_to_message_id: msg.chat.id,
            parse_mode: "HTML"
        });
    }
}