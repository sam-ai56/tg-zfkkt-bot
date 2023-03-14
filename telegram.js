const TelegramBot = require('node-telegram-bot-api');
const env = process.env;

module.exports = {
    bot: new TelegramBot(env.BOT_TOKEN, {polling: true}),
}