const name = "main_menu";
import select, { Separator } from "@inquirer/select";

async function init () {
    const choice = await select({
        message: "Меню",
        choices: [
            {
                name: "Шаблони",
                value: "template_menu"
            },
            {
                name: "Розклад",
                value: "schedule_menu"
            },
            new Separator(),
            {
                name: "Вийти",
                value: "exit"
            }
        ],
    }, {clearPromptOnDone: true});

    if (choice == "exit"){
        console.clear();
        console.log("пака");
        process.exit();
    }

    return Promise.resolve(choice);
};

export { name, init };