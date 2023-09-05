const glob = require("glob").glob;

module.exports = {
    list: [],
    async load() {
        return new Promise(async (resolve) => {
            console.log("Loading menus...");
            const files = await glob('./menus/**/*.mjs');
            files.forEach(async file => {
                const menu = await import("./"+file);
                var error = false;

                if(menu.name == undefined){
                    console.log(`Error "${file}" module name not implemented`);
                    error = true;
                }

                this.list.forEach(command => {
                    if(command.name == menu.name){
                        console.log(`Error: "${menu.name}" menu already exist`);
                        error = true;
                    }
                });

                if(menu.init == undefined){
                    console.log(`Error: "${file}" module init function not implemented`);
                    error = true;
                }

                if(error)
                    return;

                this.list.push({
                    name: menu.name,
                    init: menu.init,
                });

                console.log(`"${menu.name}" menu loaded`);
                setTimeout(() => {
                    resolve();
                }, 1000);
            });
        });
    }
};