const name = "template_menu";
import select, { Separator } from "@inquirer/select";

async function init () {
    const choice = await select({
        message: "Шаблони:",
        choices: [
            {
                name: "Створити команду",
                value: "create_command"
            },
            {
                name: "Створити сторінку",
                value: "create_page"
            },
            new Separator(),
            {
                name: "Назад",
                value: "main_menu"
            }
        ],
    }, {clearPromptOnDone: true});

    return Promise.resolve(choice);
};

export { name, init };