var env = process.env;
var location_oblast_uid = 12;

module.exports = {
    async get() {
        return new Promise(async resolve => {
            try {
                let response = await fetch(env.ALERTS_BRIDGE);
                let data = await response.json();
                var is_alert = false;

                data.alerts.forEach((alert) => {
                    if (alert.location_type == "oblast" && alert.location_uid == location_oblast_uid) {
                        is_alert = true;
                        return;
                    }
                });

                resolve({
                    is_alert: is_alert,
                    data: data
                });
            } catch (e) {
                console.log(e);
                resolve(false);
            }
        });
    }
}