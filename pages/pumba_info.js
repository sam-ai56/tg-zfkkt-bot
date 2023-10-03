const bot = require("../telegram").bot;
const link = require("../link");

const text = `
Знайомтеся з нашим чудовим ботом-помічником Pumba🤖, який має багато корисних функцій👏.

Він вміє показувати карту тривог🚨, погоду☀️ по Україні, курси валют💵 і криптовалюти💰, втрати окупантів😈 та багато іншого👍.

Також в нього є різні міні ігри🎮, з якими ви не засумуєте😉.

Ви можете дізнатися про нього більше в особистих повідомленнях📩, або просто додайте його в групу👥.
`;

module.exports = {
    name: "pumba_info",
    generate_link: true,
    func (callback) {
        bot.editMessageText(text, {
            chat_id: callback.message.chat.id,
            message_id: callback.message.message_id,
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "До пумби",
                            url: "https://t.me/PumbaBoarBot"
                        },
                        link.back_button("ss_menu", true)
                    ]
                ]
            }
        });
    }
}
