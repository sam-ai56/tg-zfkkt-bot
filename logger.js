const bot = require('./telegram').bot;
const middleware = require('./middleware');
require('colors');

bot.getMe().then((_bot) => {
    console.log(_bot.first_name + " is running...");
});

function log(msg, type, text){
    const username = msg.from.username ? msg.from.username : msg.from.first_name;

    if (type == undefined)
        type = "log";

    if (text == undefined)
        text = msg.text;

    var time_now = new Date().toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric" });

    console.log();
    console.log(`╭─[${username.cyan}, ${String(msg.from.id).cyan}, C${String(msg.chat.id).cyan}] (${time_now.grey})`);
    console.log(`╰─ ${type.blue} -> ${'"'.yellow + text.yellow + '"'.yellow}`);
}

function error(text){
    var time_now = new Date().toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric" });

    console.log();
    console.log(`╭─(${time_now.grey})`);
    console.log(`╰─ ${"error".blue} -> ${'"'.red + text.red + '"'.red}`);
}

function link(callback){
    const date = new Date();
    const links = callback.data.split(':');
    const username = callback.from.username ? callback.from.username : callback.from.first_name;

    console.log();
    console.log(`╭─[${username.cyan}, ${String(callback.from.id).cyan}] (${String(date.getHours()).padStart(2, '0').grey + ":".grey + String(date.getMinutes()).padStart(2, '0').grey})`);
    console.log(`╰─ ${"link".blue}(${links[0].red} -> ${links[1].yellow})`);
}

bot.on('message', (msg) => {
    if (!middleware.debug_mode())
        return;

    if (msg.chat.type != "private" && msg.chat.type != "channel")
        return;

    if (msg.animation){
        log(msg, "gif", JSON.stringify(msg.animation));
        return;
    }

    if (msg.sticker){
        log(msg, "sticker", msg.sticker.file_id)
        return;
    }

    if (msg.text == undefined)
        return;

    if (msg.text.startsWith('/')){
        log(msg, "command");
        return;
    }

    log(msg, "message");
});

module.exports = {
    log,
    error,
    link
}