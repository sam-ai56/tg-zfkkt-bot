const name = "create_page";
import input from "@inquirer/input";
import confirm from "@inquirer/confirm";
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
    const page_name = await input({
        message: "Назва сторінки:",
        validate: input => validate_input(input),
    }, {clearPromptOnDone: true});

    const is_file_name = await confirm({
        message: "Назва файлу така сама як назва сторінки?",
        initial: true,
    }, {clearPromptOnDone: true});

    var file_name = page_name;

    if(!is_file_name) {
        file_name = await input({
            message: "Назва файлу:",
            validate: input => validate_input(input),
        }, {clearPromptOnDone: true});
    }

    await input({
        message: "Шлях до файлу:",
        default: "./",
        description: "./pages/",
        validate: input => validate_input(input),
    }, {clearPromptOnDone: true}).then(async file_path => {

        const file = path.join("../pages", file_path, file_name + ".js");
        const folders_path = path.join("../pages", file_path);


        if (fs.existsSync(file)) {
            const overwrite = await confirm({
                message: "Файл вже існує, перезаписати?",
                initial: true,
            }, {clearPromptOnDone: true});

            if (!overwrite) {
                return;
            }

            fs.unlinkSync(file);
        }


        if (!fs.existsSync(folders_path)) {
            fs.mkdirSync(folders_path, {recursive: true});
        }


        const to_root_folder = folders_path.split("/").pop() == "" ? folders_path.split("/").slice(0, -1).map(() => "..").join("/") : folders_path.split("/").map(() => "..").join("/");


        const constants = await checkbox({
            message: "Що тобі",
            choices: [
                { name: "bot", value: "telegram", checked: true },
                { name: "db", value: "database", checked: true },
                { name: "link", value: "link", checked: true },
                { name: "env", value: "env", checked: true }
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
            case "link":
                return `const link = require("${to_root_folder}/${constant}");`
            case "env":
                return `const env = process.env;`
        }
    }).join("\n")
}

module.exports = {
    name: "${page_name}",
    func (callback) {
        console.log("HELLO FROM (${page_name}) PAGE!");
    }
}
`
        );


        console.log(`Файл ${file_name + ".js"} створено!`);
    });

    await new Promise(resolve => setTimeout(resolve, 1000));
    return Promise.resolve("main_menu");
}

export { name, init };