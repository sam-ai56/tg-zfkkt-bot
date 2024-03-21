const name = "create_command";
import input from "@inquirer/input";
import confirm from "@inquirer/confirm";
import select from "@inquirer/select";
import checkbox from "@inquirer/checkbox";
import path from "path";
import fs from "fs";

function validate_input(input) {
    if (input.length == 0) {
        return "АСТАНАВІТЕСЬ";
    }
    return true;
}

async function init () {
    const command_name = await input({
        message: "Назва команди:",
        validate: input => validate_input(input),
    }, {clearPromptOnDone: true});


    const is_file_name = await confirm({
        message: "Назва файлу така сама як назва команди?",
        initial: true,
    }, {clearPromptOnDone: true});

    var file_name = command_name;

    if(!is_file_name) {

        file_name = await input({
            message: "Назва файлу:",
            validate: input => validate_input(input),
        }, {clearPromptOnDone: true});
    }


    const description = await input({
        message: "Опис команди:",
        validate: input => validate_input(input),
    }, {clearPromptOnDone: true});


    const type = await select({
        message: "Хто може використовувати команду:",
        choices: [
            {
                name: "Приватні чати",
                value: "all_private_chats",
                description: "all_private_chats"
            },
            {
                name: "Групові чати",
                value: "all_group_chats",
                description: "all_group_chats"
            },
            {
                name: "Усі адміністратори чатів",
                value: "all_chat_administrators",
                description: "all_chat_administrators"
            },
        ],
        validate: input => validate_input(input)
    }, {clearPromptOnDone: true});


    await input({
        message: "Шлях до файлу:",
        default: "./",
        description: "./commands/",
        validate: input => validate_input(input),
    }, {clearPromptOnDone: true}).then(async file_path => {

        const file = path.join("../commands", file_path, file_name + ".js");
        const folders_path = path.join("../commands", file_path);


        if (fs.existsSync(file)) {

            const overwrite = await confirm({
                message: "Файл вже існує, перезаписати?",
                initial: true,
            }, {clearPromptOnDone: true});

            if (!overwrite) {
                return;
            }
        }


        if (!fs.existsSync(folders_path)) {
            fs.mkdirSync(folders_path, {recursive: true});
        }


        const to_root_folder = folders_path.split("/").pop() == "" ? folders_path.split("/").slice(1, -1).map(() => "..").join("/") : folders_path.split("/").map(() => "..").join("/");


        const constants = await checkbox({
            message: "Що тобі",
            choices: [
                { name: "bot", value: "telegram", checked: true },
                { name: "db", value: "database", checked: true },
                { name: "env", value: "env", checked: true },
                { name: "link", value: "link" },
            ],
        });


        fs.writeFileSync(file,
`${
        constants.map(constant => {
            switch (constant) {
                case "telegram":
                    return `const bot = require("${to_root_folder}/${constant}").bot;`
                case "database":
                    return `const db = require("${to_root_folder}/${constant}").sqlite;`
                case "env":
                    return `const env = process.env;`
                case "link":
                    return `const link = require("${to_root_folder}/${constant}");`
            }
        }).join("\n")
}
module.exports = {
    name: "${command_name}",
    description: "${description}",
    type: "${type}",
    chat_id: undefined,
    user_id: undefined,
    func (msg, args) {
        console.log("HELLO FROM (${command_name}) COMMAND!");
    }
}`);

        console.log(`Файл ${file_name + ".js"} створено!`);
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    return Promise.resolve("main_menu");
}

export { name, init };