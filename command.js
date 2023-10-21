const logger = require("./logger");
const bot = require("./telegram").bot;
const glob = require('glob').glob;
var list = [];
var commands_by_types = {
    all_private_chats: [],
    all_group_chats: [],
    all_chat_administrators: [],
    chat: [],
    chat_administrators: [],
    chat_member: [],
    default: []
};

// list
//   name: "/hello"
//   description
//   func ()
//   scope: {
//      type: tg_type,
//      ~chat_id: ....
//   }
//

function register_commands() {
    bot.setMyCommands(commands_by_types.default, {scope: {type: "default"}});

    bot.setMyCommands(commands_by_types.all_private_chats, {scope: {type: "all_private_chats"}})

    bot.setMyCommands(commands_by_types.all_group_chats, {scope: {type: "all_group_chats"}})

    bot.setMyCommands(commands_by_types.all_chat_administrators, {scope: {type: "all_chat_administrators"}})

    commands_by_types.chat.forEach(chat => {
        var chat_id = Object.keys(chat)[0];
        if(typeof(commands) == "object"){
            bot.setMyCommands([chat[chat_id]], {scope:{type:"chat", chat_id: chat_id}});
            return;
        }
        bot.setMyCommands(chat[chat_id], {scope:{type:"chat", chat_id: chat_id}});
    });

    commands_by_types.chat_administrators.forEach(chat => {
        var chat_id = Object.keys(chat)[0];
        if (typeof(chat[chat_id]) == "object"){
            bot.setMyCommands([chat[chat_id]], {scope:{type:"chat_administrators", chat_id: chat_id}});
            return;
        }
        bot.setMyCommands(chat[chat_id], {scope:{type:"chat_administrators", chat_id: chat_id}});
    });

    commands_by_types.chat_member.forEach(chat => {
        var chat_id = Object.keys(chat)[0];
        chat[chat_id].forEach(member => {
            var user_id = Object.keys(member)[0];
            if (typeof(member[user_id]) == "object"){
                bot.setMyCommands([member[user_id]], {scope:{type:"chat_member", chat_id: chat_id, user_id: user_id}});
                return;
            }
            bot.setMyCommands(member[user_id], {scope:{type:"chat_member", chat_id: chat_id, user_id: user_id}});
        });
    });
}

module.exports = {
    list,
    commands_by_types,
    async init() {
        // local registeration of commands
        const files = await glob('commands/**/*.js');
        files.forEach(file => {
            const command = require(`./${file}`);
            if (list.find(com => com.name == command.name) != undefined) {
                logger.error(`Command (${command.name}) is already registered! Ignoring...`);
                return;
            }
            list.push({
                name: command.name,
                description: command.description,
                help_description: command.help_description,
                func: command.func,
                type: command.type,
                chat_id: command.chat_id,
                user_id: command.user_id
            });
        });

        // sorting commands for setMyCommands
        list.forEach(command => {
            switch(command.type){
                case "all_private_chats":
                    commands_by_types.all_private_chats.push({
                        command: command.name,
                        description: command.description
                    });
                    break;
                case "all_group_chats":
                    commands_by_types.all_group_chats.push({
                        command: command.name,
                        description: command.description
                    });
                    break;
                case "all_chat_administrators":
                    commands_by_types.all_chat_administrators.push({
                        command: command.name,
                        description: command.description
                    });
                    break;
                case "chat":
                    var is_chat_finded = false;
                    commands_by_types.chat.map(chat => {
                        if(chat[command.chat_id]){
                            is_chat_finded = true;
                            chat[command.chat_id].push({
                                command: command.name,
                                description: command.description
                            });
                        }
                    });
                    if(!is_chat_finded) {
                        commands_by_types.chat.push({
                            [command.chat_id]: [{
                                command: command.name,
                                description: command.description
                            }]
                        });
                    }
                    break;
                case "chat_administrators":
                    var is_chat_finded = false;
                    commands_by_types.chat_administrators.map(chat => {
                        if(chat[command.chat_id]){
                            is_chat_finded = true;
                            chat[command.chat_id].push({
                                command: command.name,
                                description: command.description
                            });
                        }
                    });
                    if(!is_chat_finded) {
                        commands_by_types.chat_administrators.push({
                            [command.chat_id]: [{
                                command: command.name,
                                description: command.description
                            }]
                        });
                    }
                    break;
                case "chat_member":
                    var is_chat_finded = false;
                    commands_by_types.chat_member.map(chat => {
                        if(chat[command.chat_id]){
                            is_chat_finded = true;
                            chat[command.chat_id].map(member => {
                                if(member[command.user_id]){
                                    // is_member_finded = true;
                                    member[command.user_id].push({
                                        command: command.name,
                                        description: command.description
                                    })
                                }
                            });
                        }
                    });
                    if(!is_chat_finded) {
                        commands_by_types.chat_member.push({
                            [command.chat_id]: [{
                                [command.user_id]: {
                                    command: command.name,
                                    description: command.description
                                }
                            }]
                        });
                    }
                    break;
                // 🤓🤓🤓
                // default:
                //     commands_by_types["default"].push({
                //         command: command.name,
                //         description: command.description
                //     });
                //     break;
            }
        });

        register_commands();
        setInterval(() => register_commands(), 60_000);

        // create help.json from commands
        var help = {
            about: "",
            commands: []
        };

        list.forEach(command => {
            if (!command.help_description)
                return;
            help.commands.push({
                name: command.name,
                help_description: command.help_description,
                type: command.type
            });
        });

        help.commands.sort((a, b) => {
            if(a.name > b.name) return 1;
            if(a.name < b.name) return -1;
            return 0;
        });

        const fs = require('fs');
        fs.writeFile("help.json", JSON.stringify(help), (err) => {
            if (err) throw err;
        });
    },
    register_commands
}