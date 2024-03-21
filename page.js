const logger = require("./logger");
const link = require("./link");
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
                access: page.access,
                func: page.func,
                // allow_from_start: page.allow_from_start
            });

            if(!page.generate_link){
                link.unregister_page(page.name);
                return;
            }

            link.register_page(page.name);
        });
    }
}