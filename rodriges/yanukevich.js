const anekdoty  = [
    "Питають дружину, де ти береш гроші.",
    "Вона каже: \"У тумбочці\".",
    "Їй кажуть: \"А хто кладе в тумбочку гроші?\".",
    "Вона каже: \"Не знаю\".",
    "Так де ти береш гроші?",
    "Вона каже: \"У тумбочці\".",
    "Дааа..",
    "Нам потрібно зробити територію України небезпечною для існування",
    "Сьогодні в Києві вже встановлюється на тому місці, де вчора стояли палатки пікетувальників...",
    "Сьогодні вже встановлюється новорічна...",
    "ЙОЛКА, і люди почнуть дуже-дуже скоро святкувати Новий рік.",
    "Ми регулаьно приймаємо отчьоті губернаторов в Кієві",
    "Но... Когда увидишь своими руками",
    "Как говорится, глазами потрогаешь",
    "Саша, ну шо ти?",
    "Налий, шоб мені соромно не було!",
    "Хто це сказав? Піднімітся",
    "Я тобі поясню",
    "Зайдеш до мене окремо",
    "Меня обманулі",
    "Кінулі как лоха"
]


var anekdoty_index = 0;


function print_anekdot() {
    if (anekdoty_index == anekdoty.length) {
        anekdoty_index = 0;
    }
    console.clear();
    console.log(`\n^._.^ - ${anekdoty[anekdoty_index++]}\n`);
}

module.exports = {
    anekdoty_index,
    print_anekdot
}