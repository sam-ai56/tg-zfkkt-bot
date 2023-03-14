const bot = require('./telegram').bot;
const middleware = require('./middleware');
require('colors');

bot.getMe().then((_bot) => {
    console.log(_bot.first_name + " is running...");
});

function log(msg, type, text){
    if (!middleware.debug_mode())
        return;

    const date = new Date();
    const username = msg.from.username ? msg.from.username : msg.from.first_name;

    if (type == undefined)
        type = "log";

    if (text == undefined)
        text = msg.text;

    console.log();
    //TODO add zeros to hours and minutes
    console.log(`╭─[${username.cyan}, ${String(msg.from.id).cyan}] (${String(date.getHours()).grey + ":".grey + String(date.getMinutes()).grey})`);
    console.log(`╰─ ${type.blue} -> ${'"'.yellow + text.yellow + '"'.yellow}`);
}

function error(msg, text){
    if (!middleware.debug_mode())
        return;

    const date = new Date();
    const username = msg.from.username ? msg.from.username : msg.from.first_name;

    console.log();
    console.log(`╭─[${username.cyan}, ${String(msg.from.id).cyan}] (${String(date.getHours()).grey + ":".grey + String(date.getMinutes()).grey})`);
    console.log(`╰─ ${"error".blue} -> ${'"'.red + text.red + '"'.red}`);
}

bot.on('message', (msg) => {
    if (msg.animation){
        log(msg, "gif", msg.animation.file_id)
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
    link(callback){
        if (!middleware.debug_mode())
            return;

        const date = new Date();
        const links = callback.data.split(':');
        const username = callback.from.username ? callback.from.username : callback.from.first_name;

        console.log();
        console.log(`╭─[${username.cyan}, ${String(callback.from.id).cyan}] (${String(date.getHours()).grey + ":".grey + String(date.getMinutes()).grey})`);
        console.log(`╰─ ${"link".blue}(${links[0].red} -> ${links[1].yellow})`);
    }
}