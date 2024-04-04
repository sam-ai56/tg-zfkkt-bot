const env = process.env;
const { Api, TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const narnia = require("./narnia");

let session_string = narnia.get_value("gram_session_hash");

module.exports = {
    client: new TelegramClient(
        new StringSession(session_string === null ? "" : session_string),
        Number(env.TG_APP_ID),
        env.TG_APP_HASH,
        { connectionRetries: 5 }
    ),
    async init() {
        await this.client.start({
            botAuthToken: env.BOT_TOKEN,
        });

        narnia.set_permanent("gram_session_hash", this.client.session.save());
    },

    async get_participants(chat_id, group = false) {
        if (group) {
            // some
            // return await this.client.invoke(
            //     new Api({
            //         channel: chat_id,
            //         filter: new Api.ChannelParticipant({}),
            //         offset: 0,
            //         limit: 100,
            //         hash: BigInt("-4156887774564"),
            //     })
            // );
        }
        let ret;
        try {
            ret = await this.client.invoke(
                new Api.channels.GetParticipants({
                    channel: chat_id,
                    filter: new Api.ChannelParticipant({}),
                    offset: 0,
                    limit: 100,
                    hash: BigInt("-4156887774564"),
                })
            );
        } catch (e) {
            return false
        }
        return ret
    },

    async get_user(user_id) {
        console.log(user_id)
        return await this.client.invoke(
            new Api.users.GetFullUser({ id: user_id })
        );
    }
}