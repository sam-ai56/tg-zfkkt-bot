const logger = require("./logger");
const glob = require('glob').glob;
var list = [];

module.exports = {
    list,
    async init() {
        const files = await glob('pages/**/*.js');
        files.forEach(file => {
            const page = require(`./${file}`);
            if (list.find(item => item.link == page.name) != undefined) {
                logger.error(`Link (${page.name}) is already registered! Ignoring...`);
                return;
            }
            list.push({
                link: page.name,
                func: page.func,
            });
        });
    }
}