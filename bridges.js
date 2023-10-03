var axios = require("axios");
var env = process.env;
var location_oblast_uid = 12;

module.exports = {
    async get() {
        return new Promise(resolve => {
            axios.get(env.ALERTS_BRIDGE).then((resp) => {
                var data = resp.data;
                var alerts = data.alerts;
                var is_alert = false;
                alerts.forEach((alert) => {
                    if (alert.location_type == "oblast" && alert.location_uid == location_oblast_uid) {
                        is_alert = true;
                        return;
                    }
                });

                resolve({
                    is_alert: is_alert,
                    data: data
                });
            }).catch((err) => {
                resolve(false);
            });
        });
    }
}